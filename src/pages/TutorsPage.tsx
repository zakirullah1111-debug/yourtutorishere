import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, Star, MessageSquare, Heart, SlidersHorizontal,
  BadgeCheck, Clock, X, ChevronDown, Loader2, BookOpen,
  Zap, Users, ArrowUpDown, GraduationCap
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RequestDemoModal } from "@/components/booking/RequestDemoModal";
import { cn } from "@/lib/utils";

/* ─── types ──────────────────────────────────────────── */
interface PublicTutor {
  id: string;
  user_id: string;
  name: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  initials: string;
  avatarColor: string;
  subjects: string[];
  rating: number;
  reviews: number;
  experience: number;
  education: string;
  university: string;
  languages: string[];
  price: number;
  verified: boolean;
  teaching_mode: string | null;
  city: string | null;
  bio: string | null;
  totalStudents: number;
}

/* ─── constants ───────────────────────────────────────── */
const AVATAR_COLORS = [
  "bg-violet-500","bg-primary","bg-pink-500","bg-emerald-500",
  "bg-amber-500","bg-blue-500","bg-rose-500","bg-teal-500",
];

const SUBJECTS = [
  "Physics","Chemistry","Biology","Mathematics","Further Math","Statistics",
  "English","Urdu","Arabic","Economics","Business Studies","Accounting",
  "Islamiyat","Pakistan Studies","History","Sociology","ICT","Computer Science",
  "Psychology","Art","Quran","Commerce",
];

const LEVELS   = ["O-Level","A-Level","Matric","Intermediate","University"];
const SORTS    = ["Recommended","Rating: High to Low","Price: Low to High","Price: High to Low","Most Experienced","Most Reviews"];

/* ─── helpers ─────────────────────────────────────────── */
function priceInRange(price: number, range: string): boolean {
  if (range === "Any") return true;
  if (range === "500-800")  return price >= 500 && price <= 800;
  if (range === "800-1200") return price > 800 && price <= 1200;
  if (range === "1200-2000")return price > 1200 && price <= 2000;
  if (range === "2000+")    return price > 2000;
  return true;
}

function applySort(tutors: PublicTutor[], sort: string): PublicTutor[] {
  const arr = [...tutors];
  if (sort === "Rating: High to Low")    return arr.sort((a, b) => b.rating - a.rating);
  if (sort === "Price: Low to High")     return arr.sort((a, b) => a.price - b.price);
  if (sort === "Price: High to Low")     return arr.sort((a, b) => b.price - a.price);
  if (sort === "Most Experienced")       return arr.sort((a, b) => b.experience - a.experience);
  if (sort === "Most Reviews")           return arr.sort((a, b) => b.reviews - a.reviews);
  return arr.sort((a, b) => {
    const aScore = a.rating * 0.6 + Math.min(a.reviews / 50, 1) * 0.4;
    const bScore = b.rating * 0.6 + Math.min(b.reviews / 50, 1) * 0.4;
    return bScore - aScore;
  });
}

/* ─── TutorCard ───────────────────────────────────────── */
function TutorCard({
  tutor, onDemo, onWishlist, wishlisted, index
}: {
  tutor: PublicTutor;
  onDemo: (t: PublicTutor) => void;
  onWishlist: (id: string) => void;
  wishlisted: boolean;
  index: number;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const modeLabel =
    tutor.teaching_mode === "online"    ? "Online"     :
    tutor.teaching_mode === "in-person" ? "In-Person"  : "Online & In-Person";

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8 transition-all duration-300 hover:-translate-y-1 flex flex-col"
    >
      {/* Wishlist */}
      <button
        onClick={() => onWishlist(tutor.id)}
        className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Save tutor"
      >
        <Heart className={cn("w-3.5 h-3.5", wishlisted ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
      </button>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start gap-3.5 mb-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            {tutor.avatar_url ? (
              <img
                src={tutor.avatar_url}
                alt={tutor.name}
                className="w-16 h-16 rounded-2xl object-cover"
              />
            ) : (
              <div className={`w-16 h-16 ${tutor.avatarColor} rounded-2xl flex items-center justify-center text-white text-xl font-bold`}>
                {tutor.initials}
              </div>
            )}
            {tutor.verified && (
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-card">
                <BadgeCheck className="w-3.5 h-3.5 text-white fill-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-base leading-tight truncate pr-8">{tutor.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{tutor.university}</p>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {tutor.reviews > 0 ? (
                <>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={cn("w-3 h-3", s <= Math.round(tutor.rating) ? "fill-amber-400 text-amber-400" : "text-muted fill-muted")} />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-foreground">{tutor.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({tutor.reviews})</span>
                </>
              ) : (
                <Badge variant="secondary" className="text-[10px] px-2 py-0">New</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tutor.subjects.slice(0, 3).map(s => (
            <span key={s} className="text-[11px] font-medium px-2.5 py-1 bg-primary/8 text-primary rounded-full">
              {s}
            </span>
          ))}
          {tutor.subjects.length > 3 && (
            <span className="text-[11px] px-2.5 py-1 bg-muted text-muted-foreground rounded-full">
              +{tutor.subjects.length - 3} more
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {tutor.experience}y exp
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {tutor.totalStudents > 0 ? `${tutor.totalStudents} students` : "New tutor"}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {modeLabel}
          </span>
        </div>

        {/* Price + CTAs */}
        <div className="mt-auto pt-4 border-t border-border flex items-center gap-2">
          <div className="flex-1">
            <span className="text-lg font-bold text-primary">PKR {tutor.price.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">/hr</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-9 w-9 p-0 shrink-0"
            onClick={() => navigate(user ? `/dashboard/student/tutor/${tutor.id}` : `/signup`)}
            title="View profile"
          >
            <GraduationCap className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            className="gradient-bg text-white border-0 shadow-sm shadow-primary/25 h-9 px-4 text-xs font-semibold shrink-0"
            onClick={() => user ? onDemo(tutor) : navigate("/signup")}
          >
            Book Demo
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

/* ─── skeleton ────────────────────────────────────────── */
function TutorCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start gap-3.5 mb-4">
        <Skeleton className="w-16 h-16 rounded-2xl" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex gap-1.5 mb-4">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full mb-4" />
      <div className="pt-4 border-t border-border flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </div>
  );
}

/* ─── main page ───────────────────────────────────────── */
const TutorsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tutors,      setTutors]      = useState<PublicTutor[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [query,       setQuery]       = useState(searchParams.get("subject") || "");
  const [levelFilter, setLevelFilter] = useState(searchParams.get("level") || "");
  const [priceRange,  setPriceRange]  = useState("Any");
  const [ratingMin,   setRatingMin]   = useState(0);
  const [sort,        setSort]        = useState("Recommended");
  const [showFilters, setShowFilters] = useState(false);
  const [demoTutor,   setDemoTutor]   = useState<PublicTutor | null>(null);
  const [wishlist,    setWishlist]    = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  /* ── fetch ── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: td, error } = await supabase
          .from("tutors")
          .select("id,user_id,primary_subject,secondary_subject,additional_subjects,university,degree,education_level,years_of_experience,hourly_rate_pkr,average_rating,total_reviews,verified,languages,teaching_mode,bio_summary,total_students_taught,active_students")
          .eq("profile_complete", true);

        if (error) throw error;
        if (!td?.length) { setTutors([]); return; }

        const ids = td.map(t => t.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id,first_name,last_name,avatar_url,city")
          .in("user_id", ids);

        const mapped: PublicTutor[] = td.map((t, i) => {
          const p = profiles?.find(x => x.user_id === t.user_id);
          const name = p ? `${p.first_name} ${p.last_name}`.trim() : "Unknown";
          const initials = `${p?.first_name?.[0] || ""}${p?.last_name?.[0] || ""}`.toUpperCase();
          const subjects = [t.primary_subject, t.secondary_subject, ...(t.additional_subjects || [])].filter(Boolean) as string[];
          return {
            id: t.id, user_id: t.user_id, name, first_name: p?.first_name || "",
            last_name: p?.last_name || "", avatar_url: p?.avatar_url || null,
            initials, avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
            subjects, rating: Number(t.average_rating) || 0,
            reviews: t.total_reviews || 0, experience: t.years_of_experience || 0,
            education: t.education_level || "", university: t.university || "",
            languages: t.languages || ["English","Urdu"],
            price: t.hourly_rate_pkr || 0, verified: t.verified || false,
            teaching_mode: t.teaching_mode || null, city: p?.city || null,
            bio: t.bio_summary || null,
            totalStudents: (t.total_students_taught || 0) + (t.active_students || 0),
          };
        });
        setTutors(mapped);
      } catch (e) { console.error(e); setTutors([]); }
      finally { setLoading(false); }
    })();
  }, []);

  /* ── filter + sort ── */
  const filtered = useCallback(() => {
    let result = tutors.filter(t => {
      const q = query.toLowerCase().trim();
      if (q) {
        const matchName    = t.name.toLowerCase().includes(q);
        const matchSubject = t.subjects.some(s => s.toLowerCase().includes(q));
        if (!matchName && !matchSubject) return false;
      }
      if (!priceInRange(t.price, priceRange)) return false;
      if (ratingMin > 0 && t.rating < ratingMin) return false;
      return true;
    });
    return applySort(result, sort);
  }, [tutors, query, priceRange, ratingMin, sort]);

  const results = filtered();
  const activeFilters = [
    query && `"${query}"`,
    levelFilter && levelFilter,
    priceRange !== "Any" && `PKR ${priceRange}`,
    ratingMin > 0 && `${ratingMin}+ stars`,
  ].filter(Boolean);

  const clearAll = () => {
    setQuery(""); setLevelFilter(""); setPriceRange("Any"); setRatingMin(0);
    setSearchParams({});
  };

  const toggleWishlist = (id: string) => {
    setWishlist(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">

        {/* ── Top search bar ─────────────────────────────── */}
        <div className="bg-muted/30 border-b border-border sticky top-[64px] z-30 py-3.5">
          <div className="container mx-auto container-padding">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">

              {/* Search input */}
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search by subject or tutor name…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                  list="subject-suggest"
                />
                <datalist id="subject-suggest">
                  {SUBJECTS.map(s => <option key={s} value={s} />)}
                </datalist>
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Level */}
              <div className="relative">
                <select
                  value={levelFilter}
                  onChange={e => setLevelFilter(e.target.value)}
                  className="h-10 pl-3 pr-8 rounded-xl border border-border bg-card text-sm text-foreground appearance-none cursor-pointer focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">All Levels</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>

              {/* Price range */}
              <div className="relative">
                <select
                  value={priceRange}
                  onChange={e => setPriceRange(e.target.value)}
                  className="h-10 pl-3 pr-8 rounded-xl border border-border bg-card text-sm text-foreground appearance-none cursor-pointer focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="Any">Any Price</option>
                  <option value="500-800">PKR 500–800</option>
                  <option value="800-1200">PKR 800–1,200</option>
                  <option value="1200-2000">PKR 1,200–2,000</option>
                  <option value="2000+">PKR 2,000+</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>

              {/* Sort */}
              <div className="relative hidden md:block">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="h-10 pl-9 pr-8 rounded-xl border border-border bg-card text-sm text-foreground appearance-none cursor-pointer focus:ring-2 focus:ring-primary outline-none"
                >
                  {SORTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>

              {/* Filters toggle (mobile) */}
              <Button
                variant="outline"
                size="sm"
                className={cn("md:hidden h-10", showFilters && "border-primary text-primary")}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
              </Button>
            </div>

            {/* Mobile extra filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 flex flex-wrap gap-2.5">
                    <div className="relative">
                      <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      <select
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                        className="h-10 pl-9 pr-8 rounded-xl border border-border bg-card text-sm text-foreground appearance-none cursor-pointer"
                      >
                        {SORTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    {/* Min rating */}
                    <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 h-10">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <select
                        value={ratingMin}
                        onChange={e => setRatingMin(Number(e.target.value))}
                        className="bg-transparent text-sm text-foreground appearance-none cursor-pointer outline-none"
                      >
                        <option value={0}>Any rating</option>
                        <option value={4}>4+ stars</option>
                        <option value={4.5}>4.5+ stars</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active filter chips */}
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-2.5">
                <span className="text-xs text-muted-foreground">Active:</span>
                {activeFilters.map((f, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full font-medium">
                    {f as string}
                  </span>
                ))}
                <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Results ─────────────────────────────────────── */}
        <div className="container mx-auto container-padding py-8">

          {/* Result count + min rating (desktop) */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              {loading ? (
                <Skeleton className="h-5 w-40" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{results.length}</span> tutors
                  {query && <> for <span className="font-semibold text-foreground">"{query}"</span></>}
                </p>
              )}
            </div>
            <div className="hidden md:flex items-center gap-2 bg-card border border-border rounded-xl px-3 h-9">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={ratingMin}
                onChange={e => setRatingMin(Number(e.target.value))}
                className="bg-transparent text-sm text-foreground appearance-none cursor-pointer outline-none"
              >
                <option value={0}>Any rating</option>
                <option value={4}>4+ stars</option>
                <option value={4.5}>4.5+ stars</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => <TutorCardSkeleton key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
                <Search className="w-9 h-9 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No tutors found</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Try adjusting your filters or search for a different subject.
              </p>
              <Button variant="outline" onClick={clearAll}>Clear filters</Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {results.map((tutor, i) => (
                <TutorCard
                  key={tutor.id}
                  tutor={tutor}
                  index={i}
                  onDemo={setDemoTutor}
                  onWishlist={toggleWishlist}
                  wishlisted={wishlist.has(tutor.id)}
                />
              ))}
            </div>
          )}

          {/* AI match banner */}
          {!loading && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 p-5 rounded-2xl gradient-bg text-white flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                  <p className="font-bold">Not sure which tutor to pick?</p>
                  <p className="text-sm text-white/80">Let our AI match you with the perfect tutor for your goals.</p>
                </div>
              </div>
              <Button
                className="bg-white text-primary font-semibold hover:bg-white/92 shrink-0"
                onClick={() => navigate("/signup")}
              >
                Try AI Match →
              </Button>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
      <AIChatbot />

      {demoTutor && (
        <RequestDemoModal
          open={!!demoTutor}
          onOpenChange={v => { if (!v) setDemoTutor(null); }}
          tutor={{
            user_id:   demoTutor.user_id,
            first_name: demoTutor.first_name,
            last_name:  demoTutor.last_name,
            avatar_url: demoTutor.avatar_url,
          }}
        />
      )}
    </div>
  );
};

export default TutorsPage;
