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
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats>({
    upcomingSessionsCount: 0,
    totalHoursCompleted: 0,
    currentGradeAverage: 0,
    activeTutorsCount: 0,
  });
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch student profile
      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (studentData) {
        setStats({
          upcomingSessionsCount: 3, // Will be replaced with real query
          totalHoursCompleted: studentData.total_hours_completed || 0,
          currentGradeAverage: studentData.current_grade_average || 0,
          activeTutorsCount: studentData.assigned_tutor_id ? 1 : 0,
        });
      }

      // Mock upcoming sessions for now
      setUpcomingSessions([
        {
          id: "1",
          tutor_name: "Ali Khan",
          subject: "Mathematics",
          scheduled_date: "2026-02-03",
          scheduled_time: "16:00",
        },
        {
          id: "2",
          tutor_name: "Sara Ahmed",
          subject: "Physics",
          scheduled_date: "2026-02-04",
          scheduled_time: "17:00",
        },
      ]);

      // Mock recent activity
      setRecentActivity([
        {
          id: "1",
          type: "session",
          title: "Session Completed",
          description: "Mathematics session with Ali Khan",
          time: "2 hours ago",
        },
        {
          id: "2",
          type: "message",
          title: "New Message",
          description: "Sara Ahmed sent you a message",
          time: "5 hours ago",
        },
        {
          id: "3",
          type: "payment",
          title: "Payment Processed",
          description: "PKR 2,400 payment successful",
          time: "Yesterday",
        },
      ]);
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
