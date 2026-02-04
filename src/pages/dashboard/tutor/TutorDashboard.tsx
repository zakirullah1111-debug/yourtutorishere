import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Calendar,
  DollarSign,
  Star,
  Clock,
  TrendingUp,
  Video,
  BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";

interface TutorStats {
  activeStudents: number;
  totalSessions: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  hoursThisMonth: number;
}

interface UpcomingSession {
  id: string;
  studentName: string;
  subject: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
}

interface RecentActivity {
  id: string;
  type: "session" | "payment" | "review";
  description: string;
  time: string;
}

export default function TutorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TutorStats>({
    activeStudents: 0,
    totalSessions: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
    hoursThisMonth: 0,
  });
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        // Fetch tutor profile with stats
        const { data: tutorData } = await supabase
          .from("tutors")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (tutorData) {
          setStats({
            activeStudents: tutorData.active_students || 0,
            totalSessions: tutorData.total_students_taught || 0,
            totalEarnings: (tutorData.total_hours_taught || 0) * tutorData.hourly_rate_pkr,
            averageRating: Number(tutorData.average_rating) || 0,
            totalReviews: tutorData.total_reviews || 0,
            hoursThisMonth: tutorData.total_hours_taught || 0,
          });
        }

        // Mock upcoming sessions for now
        setUpcomingSessions([
          {
            id: "1",
            studentName: "Ahmed Khan",
            subject: "Mathematics",
            scheduledDate: "2026-02-05",
            scheduledTime: "14:00",
            duration: 60,
          },
          {
            id: "2",
            studentName: "Sara Ali",
            subject: "Physics",
            scheduledDate: "2026-02-05",
            scheduledTime: "16:00",
            duration: 60,
          },
          {
            id: "3",
            studentName: "Usman Malik",
            subject: "Chemistry",
            scheduledDate: "2026-02-06",
            scheduledTime: "10:00",
            duration: 90,
          },
        ]);

        // Mock recent activity
        setRecentActivity([
          {
            id: "1",
            type: "session",
            description: "Completed session with Ahmed Khan - Mathematics",
            time: "2 hours ago",
          },
          {
            id: "2",
            type: "review",
            description: "New 5-star review from Sara Ali",
            time: "Yesterday",
          },
          {
            id: "3",
            type: "payment",
            description: "Received payment of PKR 3,000",
            time: "2 days ago",
          },
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PK", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <DashboardLayout userType="tutor">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 lg:p-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.user_metadata?.first_name || "Tutor"}! 👋
          </h1>
          <p className="text-muted-foreground">
            You have {upcomingSessions.length} upcoming sessions this week. Keep up the great work!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                  <p className="text-2xl font-bold">{stats.activeStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">PKR {stats.totalEarnings.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-xl">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)} ⭐</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours This Month</p>
                  <p className="text-2xl font-bold">{stats.hoursThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Sessions */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/tutor/schedule">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {session.studentName.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{session.studentName}</p>
                        <p className="text-sm text-muted-foreground">{session.subject}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatDate(session.scheduledDate)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(session.scheduledTime)} • {session.duration} min
                      </p>
                    </div>
                    <Button size="sm" className="ml-4">
                      <Video className="w-4 h-4 mr-2" />
                      Start
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming sessions</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      activity.type === "session"
                        ? "bg-blue-500/10"
                        : activity.type === "review"
                        ? "bg-yellow-500/10"
                        : "bg-green-500/10"
                    }`}
                  >
                    {activity.type === "session" ? (
                      <Calendar className="w-4 h-4 text-blue-500" />
                    ) : activity.type === "review" ? (
                      <Star className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <DollarSign className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-6 flex-col gap-2" asChild>
            <Link to="/dashboard/tutor/students">
              <Users className="w-6 h-6" />
              <span>My Students</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-6 flex-col gap-2" asChild>
            <Link to="/dashboard/tutor/schedule">
              <Calendar className="w-6 h-6" />
              <span>Manage Schedule</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-6 flex-col gap-2" asChild>
            <Link to="/dashboard/tutor/resources">
              <BookOpen className="w-6 h-6" />
              <span>Resources</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-6 flex-col gap-2" asChild>
            <Link to="/dashboard/tutor/earnings">
              <TrendingUp className="w-6 h-6" />
              <span>View Earnings</span>
            </Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
