import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  BookOpen,
  GraduationCap,
  Clock,
  CheckCircle,
  Heart,
  Grid3X3,
  List,
  X,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

import { useMessaging } from "@/hooks/useMessaging";
import { useToast } from "@/hooks/use-toast";

interface Tutor {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  primary_subject: string;
  secondary_subject?: string;
  additional_subjects?: string[];
  university: string;
  degree: string;
  education_level: string;
  years_of_experience: number;
  hourly_rate_pkr: number;
  average_rating: number;
  total_reviews: number;
  city?: string;
  bio_summary?: string;
  verified: boolean;
  teaching_levels: string[];
  languages?: string[];
  math_levels?: string[];
  demo_video_url?: string | null;
  demo_video_type?: string | null;
  live_demo_enabled?: boolean;
}

type SearchType = "tutor_name" | "subject";
type SortOption = "recommended" | "price_low" | "price_high" | "rating" | "experience";
type ViewMode = "grid" | "list";

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Urdu",
  "Computer Science",
  "Economics",
  "Accounting",
  "Business Studies",
];

export default function FindTutors() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { getOrCreateConversation } = useMessaging("student");
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchType, setSearchType] = useState<SearchType>("subject");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [mathLevelFilter, setMathLevelFilter] = useState<string>("");

  // Filters
  const [priceRange, setPriceRange] = useState<[number, number]>([500, 2000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [educationFilter, setEducationFilter] = useState<string>("all");

  // Apply URL params on mount
  useEffect(() => {
    const subjectParam = searchParams.get("subject");
    const mathLevelParam = searchParams.get("math_level");
    if (subjectParam) {
      setSearchType("subject");
      setSearchQuery(subjectParam);
    }
    if (mathLevelParam) {
      setMathLevelFilter(mathLevelParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    try {
      setLoading(true);

      const { data: tutorsData, error: tutorsError } = await supabase
        .from("tutors")
        .select("*")
        .or("verified.eq.true,profile_complete.eq.true");

      if (tutorsError) throw tutorsError;

      const availableTutors = tutorsData || [];

      if (availableTutors.length === 0) {
        setTutors([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for tutor names
      const userIds = availableTutors.map((t) => t.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, avatar_url, city")
        .in("user_id", userIds);

      // Combine tutor and profile data
      const combinedTutors: Tutor[] = availableTutors.map((tutor) => {
        const profile = profilesData?.find((p) => p.user_id === tutor.user_id);
        return {
          id: tutor.id,
          user_id: tutor.user_id,
          first_name: profile?.first_name || "Unknown",
          last_name: profile?.last_name || "",
          avatar_url: profile?.avatar_url,
          city: profile?.city,
          primary_subject: tutor.primary_subject,
          secondary_subject: tutor.secondary_subject,
          additional_subjects: tutor.additional_subjects,
          university: tutor.university,
          degree: tutor.degree,
          education_level: tutor.education_level,
          years_of_experience: tutor.years_of_experience || 0,
          hourly_rate_pkr: tutor.hourly_rate_pkr,
          average_rating: Number(tutor.average_rating) || 0,
          total_reviews: tutor.total_reviews || 0,
          verified: tutor.verified || false,
          teaching_levels: tutor.teaching_levels || [],
          languages: tutor.languages || ["English", "Urdu"],
          bio_summary: tutor.bio_summary,
          math_levels: (tutor as any).math_levels || [],
          demo_video_url: (tutor as any).demo_video_url || null,
          demo_video_type: (tutor as any).demo_video_type || null,
          live_demo_enabled: (tutor as any).live_demo_enabled || false,
        };
      });

      setTutors(combinedTutors);
    } catch (error) {
      console.error("Error fetching tutors:", error);
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort tutors
  const filteredTutors = useMemo(() => {
    let result = [...tutors];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (searchType === "tutor_name") {
        result = result.filter(
          (t) =>
            t.first_name.toLowerCase().includes(query) ||
            t.last_name.toLowerCase().includes(query) ||
            `${t.first_name} ${t.last_name}`.toLowerCase().includes(query)
        );
      } else {
        result = result.filter(
          (t) =>
            t.primary_subject.toLowerCase().includes(query) ||
            t.secondary_subject?.toLowerCase().includes(query) ||
            t.additional_subjects?.some((s) => s.toLowerCase().includes(query))
        );
      }
    }

    // Price filter
    result = result.filter(
      (t) => t.hourly_rate_pkr >= priceRange[0] && t.hourly_rate_pkr <= priceRange[1]
    );

    // Rating filter
    if (minRating > 0) {
      result = result.filter((t) => t.average_rating >= minRating);
    }

    // Experience filter
    if (experienceFilter !== "all") {
      const [min, max] = experienceFilter.split("-").map(Number);
      result = result.filter((t) => {
        if (max) {
          return t.years_of_experience >= min && t.years_of_experience <= max;
        }
        return t.years_of_experience >= min;
      });
    }

    // Education filter
    if (educationFilter !== "all") {
      result = result.filter((t) => t.education_level === educationFilter);
    }

    // Math level filter
    if (mathLevelFilter) {
      result = result.filter((t) => t.math_levels?.includes(mathLevelFilter));
    }

    // Sort
    switch (sortBy) {
      case "price_low":
        result.sort((a, b) => a.hourly_rate_pkr - b.hourly_rate_pkr);
        break;
      case "price_high":
        result.sort((a, b) => b.hourly_rate_pkr - a.hourly_rate_pkr);
        break;
      case "rating":
        result.sort((a, b) => b.average_rating - a.average_rating);
        break;
      case "experience":
        result.sort((a, b) => b.years_of_experience - a.years_of_experience);
        break;
      default:
        result.sort((a, b) => {
          if (b.average_rating !== a.average_rating) return b.average_rating - a.average_rating;
          return b.total_reviews - a.total_reviews;
        });
    }

    return result;
  }, [tutors, searchQuery, searchType, priceRange, minRating, experienceFilter, educationFilter, sortBy, mathLevelFilter]);

  const toggleFavorite = (tutorId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(tutorId)) {
        newFavorites.delete(tutorId);
      } else {
        newFavorites.add(tutorId);
      }
      return newFavorites;
    });
  };

  const handleMessageTutor = async (tutorUserId: string) => {
    const convId = await getOrCreateConversation(tutorUserId);
    if (convId) {
      navigate(`/dashboard/student/messages?conversation=${convId}`);
    }
  };

  const clearFilters = () => {
    setPriceRange([500, 2000]);
    setMinRating(0);
    setExperienceFilter("all");
    setEducationFilter("all");
  };

  const hasActiveFilters =
    priceRange[0] !== 500 ||
    priceRange[1] !== 2000 ||
    minRating > 0 ||
    experienceFilter !== "all" ||
    educationFilter !== "all";

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <label className="text-sm font-medium mb-3 block">
          Price Range (PKR {priceRange[0]} - {priceRange[1]})
        </label>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          min={200}
          max={3000}
          step={100}
          className="mt-2"
        />
      </div>

      {/* Rating Filter */}
      <div>
        <label className="text-sm font-medium mb-3 block">Minimum Rating</label>
        <div className="flex gap-2">
          {[0, 4, 4.5, 5].map((rating) => (
            <Button
              key={rating}
              variant={minRating === rating ? "default" : "outline"}
              size="sm"
              onClick={() => setMinRating(rating)}
              className="flex-1"
            >
              {rating === 0 ? "All" : `${rating}+`}
              {rating > 0 && <Star className="w-3 h-3 ml-1 fill-current" />}
            </Button>
          ))}
        </div>
      </div>

      {/* Experience Filter */}
      <div>
        <label className="text-sm font-medium mb-3 block">Experience</label>
        <Select value={experienceFilter} onValueChange={setExperienceFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Any experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any experience</SelectItem>
            <SelectItem value="0-2">0-2 years</SelectItem>
            <SelectItem value="3-5">3-5 years</SelectItem>
            <SelectItem value="5-10">5-10 years</SelectItem>
            <SelectItem value="10">10+ years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Education Level */}
      <div>
        <label className="text-sm font-medium mb-3 block">Education Level</label>
        <Select value={educationFilter} onValueChange={setEducationFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Any level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any level</SelectItem>
            <SelectItem value="Bachelor's">Bachelor's</SelectItem>
            <SelectItem value="Master's">Master's</SelectItem>
            <SelectItem value="PhD">PhD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" className="w-full" onClick={clearFilters}>
          <X className="w-4 h-4 mr-2" /> Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <DashboardLayout userType="student">
      <div className="space-y-6">
        {/* Search Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Type Dropdown */}
              <Select value={searchType} onValueChange={(v) => setSearchType(v as SearchType)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subject">Search by Subject</SelectItem>
                  <SelectItem value="tutor_name">Search by Tutor Name</SelectItem>
                </SelectContent>
              </Select>

              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder={
                    searchType === "tutor_name"
                      ? "Search for tutor name..."
                      : "Search for subject (e.g., Mathematics)..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12"
                />
              </div>

              {/* Filter Button (Mobile) */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="md:hidden">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2">
                        Active
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Subject Quick Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              {SUBJECTS.slice(0, 6).map((subject) => (
                <Button
                  key={subject}
                  variant={searchQuery === subject ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSearchType("subject");
                    setSearchQuery(searchQuery === subject ? "" : subject);
                  }}
                >
                  {subject}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sort and View Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredTutors.length}</span> tutors
          </p>

          <div className="flex items-center gap-4">
            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="experience">Most Experienced</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          <div className="hidden md:block w-64 shrink-0">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Filters</h3>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear
                    </Button>
                  )}
                </div>
                <FilterContent />
              </CardContent>
            </Card>
          </div>

          {/* Tutor Results */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-muted" />
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTutors.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Tutors Found</h3>
                  <p className="text-muted-foreground mb-4">
                    We couldn't find any tutors matching your search criteria.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchType("subject");
                        setSearchQuery("");
                      }}
                    >
                      Clear Search
                    </Button>
                    <Button variant="outline" onClick={clearFilters}>
                      Reset Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTutors.map((tutor, index) => (
                  <motion.div
                    key={tutor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-14 h-14">
                              <AvatarImage src={tutor.avatar_url} />
                              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                {tutor.first_name[0]}
                                {tutor.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">
                                  {tutor.first_name} {tutor.last_name}
                                </h3>
                                {tutor.verified && (
                                  <CheckCircle className="w-4 h-4 text-primary fill-primary/20" />
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span>{tutor.average_rating.toFixed(1)}</span>
                                <span>({tutor.total_reviews} reviews)</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleFavorite(tutor.id)}
                            className="p-2 hover:bg-muted rounded-full"
                          >
                            <Heart
                              className={`w-5 h-5 ${
                                favorites.has(tutor.id)
                                  ? "fill-red-500 text-red-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {tutor.primary_subject}
                              {tutor.secondary_subject && `, ${tutor.secondary_subject}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <GraduationCap className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">
                              {tutor.degree} - {tutor.university}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{tutor.years_of_experience} years experience</span>
                          </div>
                          {tutor.city && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{tutor.city}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div>
                            <span className="text-lg font-bold text-primary">
                              PKR {tutor.hourly_rate_pkr.toLocaleString()}
                            </span>
                            <span className="text-sm text-muted-foreground">/hour</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button variant="outline" className="flex-1 min-h-[44px] text-[13px] sm:text-sm" asChild>
                            <Link to={`/dashboard/student/tutor/${tutor.id}`}>View Profile</Link>
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 min-h-[44px] text-[13px] sm:text-sm"
                            onClick={() => handleMessageTutor(tutor.user_id)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                          {tutor.demo_video_url ? (
                            <Button className="w-full sm:w-auto sm:flex-1 min-h-[44px] text-[13px] sm:text-sm" asChild>
                              <Link to={`/dashboard/student/tutor/${tutor.id}#demo-video`}>▶ Watch Demo</Link>
                            </Button>
                          ) : tutor.live_demo_enabled ? (
                            <Button className="w-full sm:w-auto sm:flex-1 min-h-[44px] text-[13px] sm:text-sm" asChild>
                              <Link to={`/dashboard/student/tutor/${tutor.id}`}>📅 Book Demo</Link>
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTutors.map((tutor, index) => (
                  <motion.div
                    key={tutor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="w-20 h-20">
                              <AvatarImage src={tutor.avatar_url} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                {tutor.first_name[0]}
                                {tutor.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold">
                                  {tutor.first_name} {tutor.last_name}
                                </h3>
                                {tutor.verified && (
                                  <CheckCircle className="w-5 h-5 text-primary fill-primary/20" />
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span>{tutor.average_rating.toFixed(1)}</span>
                                <span>({tutor.total_reviews} reviews)</span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {tutor.bio_summary || `Experienced ${tutor.primary_subject} tutor with ${tutor.years_of_experience} years of teaching experience.`}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Badge variant="secondary">{tutor.primary_subject}</Badge>
                                {tutor.secondary_subject && (
                                  <Badge variant="outline">{tutor.secondary_subject}</Badge>
                                )}
                                <Badge variant="outline">{tutor.education_level}</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-between">
                            <button
                              onClick={() => toggleFavorite(tutor.id)}
                              className="p-2 hover:bg-muted rounded-full"
                            >
                              <Heart
                                className={`w-5 h-5 ${
                                  favorites.has(tutor.id)
                                    ? "fill-red-500 text-red-500"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </button>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-primary">
                                PKR {tutor.hourly_rate_pkr.toLocaleString()}
                              </span>
                              <span className="text-sm text-muted-foreground">/hour</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" className="flex-1 sm:flex-none min-h-[44px] text-[13px] sm:text-sm" asChild>
                                <Link to={`/dashboard/student/tutor/${tutor.id}`}>View Profile</Link>
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 sm:flex-none min-h-[44px] text-[13px] sm:text-sm"
                                onClick={() => handleMessageTutor(tutor.user_id)}
                              >
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Message
                              </Button>
                              {tutor.demo_video_url ? (
                                <Button className="w-full sm:w-auto min-h-[44px] text-[13px] sm:text-sm" asChild>
                                  <Link to={`/dashboard/student/tutor/${tutor.id}#demo-video`}>▶ Watch Demo</Link>
                                </Button>
                              ) : tutor.live_demo_enabled ? (
                                <Button className="w-full sm:w-auto min-h-[44px] text-[13px] sm:text-sm" asChild>
                                  <Link to={`/dashboard/student/tutor/${tutor.id}`}>📅 Book Demo</Link>
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
