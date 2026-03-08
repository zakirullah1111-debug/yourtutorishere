import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  MessageSquare,
  Video,
  Star,
  Clock,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface MyTutor {
  id: string;
  name: string;
  avatar?: string;
  subject: string;
  nextSession?: {
    date: string;
    time: string;
  };
  sessionsCompleted: number;
  totalHours: number;
  progress: "Excellent" | "Good" | "Needs Improvement";
  rating: number;
}

export default function MyTutors() {
  const { user } = useAuth();
  const [tutors, setTutors] = useState<MyTutor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now
    setTutors([
      {
        id: "1",
        name: "Ali Khan",
        subject: "Mathematics",
        nextSession: { date: "Tomorrow", time: "4:00 PM" },
        sessionsCompleted: 12,
        totalHours: 18,
        progress: "Excellent",
        rating: 4.9,
      },
      {
        id: "2",
        name: "Sara Ahmed",
        subject: "Physics",
        nextSession: { date: "Wed, Feb 5", time: "5:00 PM" },
        sessionsCompleted: 8,
        totalHours: 12,
        progress: "Good",
        rating: 4.8,
      },
    ]);
    setLoading(false);
  }, [user]);

  const getProgressColor = (progress: string) => {
    switch (progress) {
      case "Excellent":
        return "bg-green-500/10 text-green-600";
      case "Good":
        return "bg-blue-500/10 text-blue-600";
      default:
        return "bg-yellow-500/10 text-yellow-600";
    }
  };

  return (
    <DashboardLayout userType="student">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">My Tutors</h1>
            <p className="text-muted-foreground">Manage your current tutors</p>
          </div>
          <Button asChild className="w-full sm:w-auto min-h-[44px]">
            <Link to="/dashboard/student/find-tutors">Find New Tutor</Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-24 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tutors.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Tutors Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start your learning journey by finding a tutor
              </p>
              <Button asChild>
                <Link to="/dashboard/student/find-tutors">Find Tutors</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tutors.map((tutor) => (
              <Card key={tutor.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={tutor.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {tutor.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{tutor.name}</h3>
                        <p className="text-muted-foreground">{tutor.subject}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{tutor.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div>
                        <p className="text-xl sm:text-2xl font-bold">{tutor.sessionsCompleted}</p>
                        <p className="text-xs text-muted-foreground">Sessions</p>
                      </div>
                      <div>
                        <p className="text-xl sm:text-2xl font-bold">{tutor.totalHours}h</p>
                        <p className="text-xs text-muted-foreground">Total Hours</p>
                      </div>
                      <div>
                        <Badge className={getProgressColor(tutor.progress)}>
                          {tutor.progress}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">Progress</p>
                      </div>
                      {tutor.nextSession && (
                        <div>
                          <p className="text-sm font-medium">{tutor.nextSession.date}</p>
                          <p className="text-xs text-muted-foreground">{tutor.nextSession.time}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-1" /> Message
                      </Button>
                      <Button size="sm">
                        <Video className="w-4 h-4 mr-1" /> Book Session
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
