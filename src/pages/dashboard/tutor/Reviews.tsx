import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
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
  const [filterRating, setFilterRating] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const overallRating = 4.8;
  const totalReviews = 47;
  const ratingDistribution = [
    { stars: 5, count: 35, percentage: 74 },
    { stars: 4, count: 8, percentage: 17 },
    { stars: 3, count: 3, percentage: 6 },
    { stars: 2, count: 1, percentage: 2 },
    { stars: 1, count: 0, percentage: 0 },
  ];

  const reviews: Review[] = [
    {
      id: "1",
      studentName: "Ahmed Khan",
      subject: "Mathematics",
      rating: 5,
      comment:
        "Excellent tutor! Sir explains complex concepts in a very simple way. My grades have improved significantly since I started taking classes. Highly recommended for anyone struggling with math.",
      date: "2026-02-01",
      helpful: 12,
      verified: true,
    },
    {
      id: "2",
      studentName: "Sara Ali",
      subject: "Physics",
      rating: 5,
      comment:
        "Best physics tutor I've ever had. Very patient and knowledgeable. Makes learning fun with real-world examples.",
      date: "2026-01-28",
      helpful: 8,
      verified: true,
    },
    {
      id: "3",
      studentName: "Usman Malik",
      subject: "Chemistry",
      rating: 4,
      comment:
        "Great teaching style. Sometimes the sessions go a bit fast, but overall very helpful. Good at explaining organic chemistry.",
      date: "2026-01-25",
      helpful: 5,
      verified: true,
    },
    {
      id: "4",
      studentName: "Fatima Zahra",
      subject: "Mathematics",
      rating: 5,
      comment:
        "My daughter's math scores went from C to A after just 2 months. Very professional and punctual tutor.",
      date: "2026-01-20",
      helpful: 15,
      verified: true,
    },
    {
      id: "5",
      studentName: "Hassan Raza",
      subject: "Physics",
      rating: 4,
      comment:
        "Good tutor with solid subject knowledge. Helped me prepare for my board exams effectively.",
      date: "2026-01-15",
      helpful: 3,
      verified: false,
    },
  ];

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
