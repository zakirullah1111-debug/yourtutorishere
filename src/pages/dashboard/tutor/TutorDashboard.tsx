import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSessionCompletion } from "@/hooks/useSessionCompletion";
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
 
   const formatTimeAgo = (date: Date) => {
     const now = new Date();
     const diffMs = now.getTime() - date.getTime();
     const diffMins = Math.floor(diffMs / 60000);
     const diffHours = Math.floor(diffMs / 3600000);
     const diffDays = Math.floor(diffMs / 86400000);
 
     if (diffMins < 60) return `${diffMins} minutes ago`;
     if (diffHours < 24) return `${diffHours} hours ago`;
     if (diffDays === 1) return "Yesterday";
     if (diffDays < 7) return `${diffDays} days ago`;
     return date.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
   };

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        // Fetch tutor profile with stats
        const { data: tutorData } = await supabase
          .from("tutors")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (tutorData) {
          // Fetch real earnings
          const { data: paymentsData } = await supabase
            .from("payments")
            .select("amount_pkr")
            .eq("tutor_id", tutorData.id)
            .eq("payment_status", "Completed");

          const totalEarnings = paymentsData?.reduce((sum, p) => sum + p.amount_pkr, 0) || 0;

          // Fetch sessions this month
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          const { data: monthSessions } = await supabase
            .from("sessions")
            .select("duration_minutes")
            .eq("tutor_id", tutorData.id)
            .eq("status", "Completed")
            .gte("completed_at", startOfMonth.toISOString());

          const hoursThisMonth = Math.round((monthSessions?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0) / 60);

          setStats({
            activeStudents: tutorData.active_students || 0,
            totalSessions: tutorData.total_students_taught || 0,
            totalEarnings: totalEarnings || (tutorData.total_hours_taught || 0) * tutorData.hourly_rate_pkr,
            averageRating: Number(tutorData.average_rating) || 0,
            totalReviews: tutorData.total_reviews || 0,
            hoursThisMonth: hoursThisMonth || tutorData.total_hours_taught || 0,
          });

          // Fetch real upcoming sessions
          const today = new Date().toISOString().split("T")[0];
          const { data: sessionsData } = await supabase
            .from("sessions")
            .select("id, subject, scheduled_date, scheduled_time, duration_minutes, student_id, status")
            .eq("tutor_id", tutorData.id)
            .gte("scheduled_date", today)
            .in("status", ["Scheduled", "scheduled"])
            .order("scheduled_date", { ascending: true })
            .limit(5);

          if (sessionsData && sessionsData.length > 0) {
            const studentIds = [...new Set(sessionsData.map((s) => s.student_id))];
            const { data: studentRecords } = await supabase
              .from("students")
              .select("id, user_id")
              .in("id", studentIds);

            const studentUserIds = studentRecords?.map((s) => s.user_id) || [];
            const { data: studentProfiles } = await supabase
              .from("profiles")
              .select("user_id, first_name, last_name")
              .in("user_id", studentUserIds);

            const studentMap = new Map();
            studentRecords?.forEach((s) => {
              const profile = studentProfiles?.find((p) => p.user_id === s.user_id);
              if (profile) studentMap.set(s.id, profile);
            });

            setUpcomingSessions(
              sessionsData.map((session) => {
                const studentProfile = studentMap.get(session.student_id);
                return {
                  id: session.id,
                  studentName: studentProfile
                    ? `${studentProfile.first_name} ${studentProfile.last_name}`
                    : "Unknown Student",
                  subject: session.subject,
                  scheduledDate: session.scheduled_date,
                  scheduledTime: session.scheduled_time,
                  duration: session.duration_minutes,
                };
              })
            );
          }

          // Fetch real activity
          const activities: RecentActivity[] = [];

          const { data: recentSessions } = await supabase
            .from("sessions")
            .select("id, subject, completed_at, student_id")
            .eq("tutor_id", tutorData.id)
            .eq("status", "Completed")
            .order("completed_at", { ascending: false })
            .limit(2);

          if (recentSessions?.length) {
            const sIds = recentSessions.map((s) => s.student_id);
            const { data: sRecords } = await supabase.from("students").select("id, user_id").in("id", sIds);
            const sUserIds = sRecords?.map((s) => s.user_id) || [];
            const { data: sProfiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", sUserIds);

            recentSessions.forEach((session) => {
              const sRec = sRecords?.find((s) => s.id === session.student_id);
              const profile = sProfiles?.find((p) => p.user_id === sRec?.user_id);
              activities.push({
                id: `session-${session.id}`,
                type: "session",
                description: `Completed session with ${profile ? `${profile.first_name} ${profile.last_name}` : "a student"} - ${session.subject}`,
                time: session.completed_at ? formatTimeAgo(new Date(session.completed_at)) : "Recently",
              });
            });
          }

          const { data: recentReviews } = await supabase
            .from("reviews")
            .select("id, rating, created_at, student_id")
            .eq("tutor_id", tutorData.id)
            .order("created_at", { ascending: false })
            .limit(2);

          if (recentReviews?.length) {
            const rIds = recentReviews.map((r) => r.student_id);
            const { data: rRecords } = await supabase.from("students").select("id, user_id").in("id", rIds);
            const rUserIds = rRecords?.map((s) => s.user_id) || [];
            const { data: rProfiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", rUserIds);

            recentReviews.forEach((review) => {
              const rRec = rRecords?.find((s) => s.id === review.student_id);
              const profile = rProfiles?.find((p) => p.user_id === rRec?.user_id);
              activities.push({
                id: `review-${review.id}`,
                type: "review",
                description: `New ${review.rating}-star review from ${profile ? `${profile.first_name} ${profile.last_name}` : "a student"}`,
                time: formatTimeAgo(new Date(review.created_at)),
              });
            });
          }

          const { data: recentPayments } = await supabase
            .from("payments")
            .select("id, amount_pkr, created_at")
            .eq("tutor_id", tutorData.id)
            .eq("payment_status", "Completed")
            .order("created_at", { ascending: false })
            .limit(2);

          recentPayments?.forEach((payment) => {
            activities.push({
              id: `payment-${payment.id}`,
              type: "payment",
              description: `Received payment of PKR ${payment.amount_pkr.toLocaleString()}`,
              time: formatTimeAgo(new Date(payment.created_at)),
            });
          });

          setRecentActivity(activities.slice(0, 5));
        }
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
