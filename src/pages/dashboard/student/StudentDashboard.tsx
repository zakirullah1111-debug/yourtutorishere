import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Video,
  ArrowRight,
  MessageSquare,
  CreditCard,
  Star,
  BookOpen,
  GraduationCap,
  MapPin,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSessionCompletion } from "@/hooks/useSessionCompletion";

interface StudentStats {
  upcomingSessionsCount: number;
  totalHoursCompleted: number;
  currentGradeAverage: number;
  activeTutorsCount: number;
}

interface UpcomingSession {
  id: string;
  tutor_name: string;
  tutor_avatar?: string;
  subject: string;
  scheduled_date: string;
  scheduled_time: string;
}

interface RecentActivity {
  id: string;
  type: "session" | "message" | "payment" | "review";
  title: string;
  description: string;
  time: string;
}

interface FeaturedTutor {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  primary_subject: string;
  secondary_subject?: string;
  university: string;
  average_rating: number;
  total_reviews: number;
  hourly_rate_pkr: number;
  years_of_experience: number;
  verified: boolean;
  city?: string;
}

interface SubjectCategory {
  name: string;
  emoji: string;
  tutorCount: number;
  color: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  useSessionCompletion();
  const [stats, setStats] = useState<StudentStats>({
    upcomingSessionsCount: 0,
    totalHoursCompleted: 0,
    currentGradeAverage: 0,
    activeTutorsCount: 0,
  });
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [featuredTutors, setFeaturedTutors] = useState<FeaturedTutor[]>([]);
  const [subjects, setSubjects] = useState<SubjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [userName, setUserName] = useState("");
 
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
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user?.id)
        .single();

      if (profileData) {
        setUserName(profileData.first_name);
      }

      // Fetch student profile
      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (studentData) {
        const hasCompletedSessions = (studentData.total_sessions_completed || 0) > 0;
        setIsNewUser(!hasCompletedSessions);
        
        setStats({
          upcomingSessionsCount: 0,
          totalHoursCompleted: studentData.total_hours_completed || 0,
          currentGradeAverage: studentData.current_grade_average || 0,
          activeTutorsCount: studentData.assigned_tutor_id ? 1 : 0,
        });
      } else {
        setIsNewUser(true);
      }

      // Fetch featured tutors (top rated, verified)
      const { data: tutorsData } = await supabase
        .from("tutors")
        .select("*")
        .eq("status", "Active")
        .eq("verified", true)
        .order("average_rating", { ascending: false })
        .limit(6);

      if (tutorsData) {
        // Fetch profiles for tutor names
        const userIds = tutorsData.map((t) => t.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url, city")
          .in("user_id", userIds);

        const combinedTutors: FeaturedTutor[] = tutorsData.map((tutor) => {
          const profile = profilesData?.find((p) => p.user_id === tutor.user_id);
          return {
            id: tutor.id,
            first_name: profile?.first_name || "Unknown",
            last_name: profile?.last_name || "",
            avatar_url: profile?.avatar_url,
            city: profile?.city,
            primary_subject: tutor.primary_subject,
            secondary_subject: tutor.secondary_subject,
            university: tutor.university,
            average_rating: Number(tutor.average_rating) || 0,
            total_reviews: tutor.total_reviews || 0,
            hourly_rate_pkr: tutor.hourly_rate_pkr,
            years_of_experience: tutor.years_of_experience || 0,
            verified: tutor.verified || false,
          };
        });

        setFeaturedTutors(combinedTutors);
      }

      // Fetch subjects with tutor counts
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("name, category, tutor_count")
        .order("tutor_count", { ascending: false })
        .limit(8);

      if (subjectsData) {
        const categoryEmojis: Record<string, string> = {
          Sciences: "🔬",
          Languages: "💬",
          Business: "💼",
          Humanities: "📚",
        };
        const categoryColors: Record<string, string> = {
          Sciences: "from-blue-500 to-cyan-500",
          Languages: "from-primary to-purple-500",
          Business: "from-accent to-orange-500",
          Humanities: "from-success to-emerald-500",
        };

        setSubjects(
          subjectsData.map((s) => ({
            name: s.name,
            emoji: categoryEmojis[s.category] || "📚",
            tutorCount: s.tutor_count || 0,
            color: categoryColors[s.category] || "from-primary to-purple-500",
          }))
        );
      } else {
        setSubjects([]);
      }

      // Fetch real upcoming sessions (from sessions table)
      const { data: studentRecord } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      // Also fetch upcoming demo_bookings
      const today = new Date().toISOString().split("T")[0];
      const { data: demoBookings } = await supabase
        .from("demo_bookings")
        .select("id, scheduled_date, scheduled_time, tutor_id")
        .eq("student_id", user?.id)
        .eq("status", "confirmed")
        .gte("scheduled_date", today)
        .order("scheduled_date", { ascending: true })
        .limit(5);

      if (demoBookings && demoBookings.length > 0) {
        const tutorUserIds = [...new Set(demoBookings.map(b => b.tutor_id))];
        const { data: tutorProfiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", tutorUserIds);

        const profileMap = new Map((tutorProfiles || []).map(p => [p.user_id, p]));

        setUpcomingSessions(
          demoBookings.map(b => {
            const prof = profileMap.get(b.tutor_id);
            return {
              id: b.id,
              tutor_name: prof ? `${prof.first_name} ${prof.last_name}`.trim() : "Tutor",
              tutor_avatar: prof?.avatar_url,
              subject: "Demo Session",
              scheduled_date: b.scheduled_date,
              scheduled_time: b.scheduled_time,
            };
          })
        );

        setStats(prev => ({ ...prev, upcomingSessionsCount: demoBookings.length }));
      } else if (studentRecord) {
        const { data: sessionsData } = await supabase
          .from("sessions")
          .select("id, subject, scheduled_date, scheduled_time, tutor_id, status")
          .eq("student_id", studentRecord.id)
          .gte("scheduled_date", today)
          .in("status", ["Scheduled", "scheduled"])
          .order("scheduled_date", { ascending: true })
          .limit(5);

        if (sessionsData && sessionsData.length > 0) {
          const tutorIds = [...new Set(sessionsData.map((s) => s.tutor_id))];
          const { data: tutorRecords } = await supabase
            .from("tutors")
            .select("id, user_id")
            .in("id", tutorIds);

          const tutorUserIds2 = tutorRecords?.map((t) => t.user_id) || [];
          const { data: tutorProfiles2 } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name, avatar_url")
            .in("user_id", tutorUserIds2);

          const tutorMap = new Map();
          tutorRecords?.forEach((t) => {
            const profile = tutorProfiles2?.find((p) => p.user_id === t.user_id);
            if (profile) tutorMap.set(t.id, profile);
          });

          setUpcomingSessions(
            sessionsData.map((session) => {
              const tutorProfile = tutorMap.get(session.tutor_id);
              return {
                id: session.id,
                tutor_name: tutorProfile
                  ? `${tutorProfile.first_name} ${tutorProfile.last_name}`
                  : "Unknown Tutor",
                tutor_avatar: tutorProfile?.avatar_url,
                subject: session.subject,
                scheduled_date: session.scheduled_date,
                scheduled_time: session.scheduled_time,
              };
            })
          );

          setStats((prev) => ({ ...prev, upcomingSessionsCount: sessionsData.length }));
        }
      }

      if (studentRecord) {

        // Fetch recent activity
        const activities: RecentActivity[] = [];

        const { data: recentSessions } = await supabase
          .from("sessions")
          .select("id, subject, completed_at")
          .eq("student_id", studentRecord.id)
          .eq("status", "Completed")
          .order("completed_at", { ascending: false })
          .limit(3);

        recentSessions?.forEach((session) => {
          activities.push({
            id: `session-${session.id}`,
            type: "session",
            title: "Session Completed",
            description: `${session.subject} session completed`,
            time: session.completed_at ? formatTimeAgo(new Date(session.completed_at)) : "Recently",
          });
        });

        const { data: recentPayments } = await supabase
          .from("payments")
          .select("id, amount_pkr, created_at, payment_status")
          .eq("student_id", studentRecord.id)
          .order("created_at", { ascending: false })
          .limit(2);

        recentPayments?.forEach((payment) => {
          activities.push({
            id: `payment-${payment.id}`,
            type: "payment",
            title: payment.payment_status === "Completed" ? "Payment Processed" : "Payment Pending",
            description: `PKR ${payment.amount_pkr.toLocaleString()} ${payment.payment_status?.toLowerCase()}`,
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
  };

  const statCards = [
    {
      label: "Upcoming Sessions",
      value: stats.upcomingSessionsCount,
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      link: "/dashboard/student/sessions",
    },
    {
      label: "Hours Completed",
      value: `${stats.totalHoursCompleted}h`,
      icon: Clock,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Grade Average",
      value: stats.currentGradeAverage > 0 ? `${stats.currentGradeAverage}%` : "N/A",
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      link: "/dashboard/student/progress",
    },
    {
      label: "Active Tutors",
      value: stats.activeTutorsCount,
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      link: "/dashboard/student/my-tutors",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "session":
        return <Video className="w-4 h-4" />;
      case "message":
        return <MessageSquare className="w-4 h-4" />;
      case "payment":
        return <CreditCard className="w-4 h-4" />;
      case "review":
        return <Star className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout userType="student">
      <div className="space-y-8">
        {/* Welcome Section for New Users */}
        {isNewUser && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-purple-600 to-pink-500 p-6 md:p-8 text-white"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium text-white/80">Welcome to Your-Tutor!</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Hello{userName ? `, ${userName}` : ""}! 👋
              </h1>
              <p className="text-white/80 mb-6 max-w-xl">
                You're all set! Start by exploring our expert tutors or browse subjects you want to learn. 
                Your first demo class is free!
              </p>
              <div className="flex flex-wrap gap-3">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90"
                  asChild
                >
                  <Link to="/dashboard/student/find-tutors">
                    <Users className="w-5 h-5 mr-2" />
                    Find a Tutor
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10"
                  asChild
                >
                  <Link to="/subjects">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Browse Subjects
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Available Subjects Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Popular Subjects
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/subjects">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {subjects.map((subject, index) => (
                <motion.div
                  key={subject.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/dashboard/student/find-tutors?subject=${encodeURIComponent(subject.name)}`}
                    className="block p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{subject.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {subject.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {subject.tutorCount}+ tutors
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Featured Tutors Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Top Rated Tutors
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/student/find-tutors">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {featuredTutors.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No tutors available yet</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link to="/dashboard/student/find-tutors">Browse All Tutors</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredTutors.slice(0, 6).map((tutor, index) => (
                  <motion.div
                    key={tutor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/dashboard/student/find-tutors?tutor=${tutor.id}`}
                      className="block p-4 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={tutor.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {tutor.first_name[0]}{tutor.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold truncate">
                              {tutor.first_name} {tutor.last_name}
                            </h4>
                            {tutor.verified && (
                              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-amber-500 mt-0.5">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="font-medium">{tutor.average_rating.toFixed(1)}</span>
                            <span className="text-muted-foreground">
                              ({tutor.total_reviews} reviews)
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="truncate">{tutor.primary_subject}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-medium text-primary">
                              PKR {tutor.hourly_rate_pkr}/hr
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {tutor.years_of_experience}+ yrs
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard/student/sessions">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No upcoming sessions</p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link to="/dashboard/student/find-tutors">Find a Tutor</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={session.tutor_avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {session.tutor_name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{session.tutor_name}</p>
                            <p className="text-sm text-muted-foreground">{session.subject}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(session.scheduled_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">{session.scheduled_time}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Video className="w-4 h-4 mr-1" /> Join
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="p-2 rounded-lg bg-muted h-fit">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/dashboard/student/find-tutors">
                  <Users className="w-5 h-5" />
                  <span>Find Tutors</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/dashboard/student/sessions">
                  <Calendar className="w-5 h-5" />
                  <span>Book Session</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/dashboard/student/messages">
                  <MessageSquare className="w-5 h-5" />
                  <span>Messages</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/dashboard/student/progress">
                  <TrendingUp className="w-5 h-5" />
                  <span>View Progress</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
