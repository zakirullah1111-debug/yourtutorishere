import { useState } from "react";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, ThumbsUp, MessageSquare, TrendingUp, Filter } from "lucide-react";

interface Review {
  id: string;
  studentName: string;
  subject: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  verified: boolean;
}

export default function Reviews() {
  const { user } = useAuth();
  const [filterRating, setFilterRating] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [overallRating, setOverallRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState([
    { stars: 5, count: 0, percentage: 0 },
    { stars: 4, count: 0, percentage: 0 },
    { stars: 3, count: 0, percentage: 0 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      if (!user) return;

      try {
        const { data: tutorData } = await supabase
          .from("tutors")
          .select("id, average_rating, total_reviews")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!tutorData) {
          setLoading(false);
          return;
        }

        setOverallRating(Number(tutorData.average_rating) || 0);
        setTotalReviews(tutorData.total_reviews || 0);

        // Fetch all reviews
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("*")
          .eq("tutor_id", tutorData.id)
          .order("created_at", { ascending: false });

        if (reviewsData && reviewsData.length > 0) {
          // Get student names
          const studentIds = reviewsData.map((r) => r.student_id);
          const { data: studentRecords } = await supabase
            .from("students")
            .select("id, user_id, primary_subject")
            .in("id", studentIds);

          const userIds = studentRecords?.map((s) => s.user_id) || [];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", userIds);

          const studentMap = new Map();
          studentRecords?.forEach((s) => {
            const profile = profiles?.find((p) => p.user_id === s.user_id);
            studentMap.set(s.id, {
              name: profile ? `${profile.first_name} ${profile.last_name}` : "Unknown",
              subject: s.primary_subject,
            });
          });

          setReviews(
            reviewsData.map((r) => {
              const student = studentMap.get(r.student_id);
              return {
                id: r.id,
                studentName: student?.name || "Unknown Student",
                subject: student?.subject || "N/A",
                rating: r.rating,
                comment: r.comment || "",
                date: r.created_at.split("T")[0],
                helpful: 0,
                verified: r.is_verified || false,
              };
            })
          );

          // Calculate rating distribution
          const dist = [0, 0, 0, 0, 0];
          reviewsData.forEach((r) => {
            if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
          });
          const total = reviewsData.length;
          setRatingDistribution([
            { stars: 5, count: dist[4], percentage: Math.round((dist[4] / total) * 100) },
            { stars: 4, count: dist[3], percentage: Math.round((dist[3] / total) * 100) },
            { stars: 3, count: dist[2], percentage: Math.round((dist[2] / total) * 100) },
            { stars: 2, count: dist[1], percentage: Math.round((dist[1] / total) * 100) },
            { stars: 1, count: dist[0], percentage: Math.round((dist[0] / total) * 100) },
          ]);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [user]);

  const subjects = [...new Set(reviews.map((r) => r.subject))];

  const filteredReviews = reviews
    .filter((review) => {
      const matchesRating =
        filterRating === "all" || review.rating === parseInt(filterRating);
      const matchesSubject = filterSubject === "all" || review.subject === filterSubject;
      return matchesRating && matchesSubject;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "highest") {
        return b.rating - a.rating;
      } else if (sortBy === "helpful") {
        return b.helpful - a.helpful;
      }
      return 0;
    });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
        }`}
      />
    ));
  };

  return (
    <DashboardLayout userType="tutor">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">See what your students are saying about you</p>
        </div>

        {/* Overview Cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Overall Rating Card */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/10 mb-4">
                <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
              </div>
              <h2 className="text-4xl font-bold">{overallRating}</h2>
              <div className="flex justify-center gap-1 my-2">{renderStars(5)}</div>
              <p className="text-muted-foreground">{totalReviews} reviews</p>

              <div className="mt-6 space-y-2">
                {ratingDistribution.map((item) => (
                  <div key={item.stars} className="flex items-center gap-2">
                    <span className="text-sm w-8">{item.stars}★</span>
                    <Progress value={item.percentage} className="flex-1 h-2" />
                    <span className="text-sm text-muted-foreground w-8">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Review Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">Improving</span>
                  </div>
                  <p className="text-2xl font-bold">+0.3</p>
                  <p className="text-sm text-muted-foreground">Rating increase this month</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-medium">New Reviews</span>
                  </div>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-sm text-muted-foreground">In the last 30 days</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 text-yellow-600 mb-2">
                    <Star className="w-5 h-5" />
                    <span className="font-medium">5-Star Reviews</span>
                  </div>
                  <p className="text-2xl font-bold">74%</p>
                  <p className="text-sm text-muted-foreground">Of all reviews</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <ThumbsUp className="w-5 h-5" />
                    <span className="font-medium">Helpful Votes</span>
                  </div>
                  <p className="text-2xl font-bold">43</p>
                  <p className="text-sm text-muted-foreground">Students found helpful</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="highest">Highest Rated</SelectItem>
                  <SelectItem value="helpful">Most Helpful</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {review.studentName.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{review.studentName}</h3>
                          {review.verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {review.subject} • {formatDate(review.date)}
                        </p>
                      </div>
                      <div className="flex gap-1">{renderStars(review.rating)}</div>
                    </div>
                    <p className="mt-3 text-muted-foreground">{review.comment}</p>
                    <div className="mt-4 flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        Helpful ({review.helpful})
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
