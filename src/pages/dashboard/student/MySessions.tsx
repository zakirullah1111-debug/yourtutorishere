import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Video,
  Clock,
  MoreVertical,
  Play,
  FileText,
  Star,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Session {
  id: string;
  tutorName: string;
  tutorAvatar?: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  status: "upcoming" | "completed" | "cancelled";
  hasRecording?: boolean;
}

export default function MySessions() {
  const [sessions] = useState<Session[]>([
    {
      id: "1",
      tutorName: "Ali Khan",
      subject: "Mathematics",
      date: "2026-02-03",
      time: "16:00",
      duration: 60,
      status: "upcoming",
    },
    {
      id: "2",
      tutorName: "Sara Ahmed",
      subject: "Physics",
      date: "2026-02-05",
      time: "17:00",
      duration: 60,
      status: "upcoming",
    },
    {
      id: "3",
      tutorName: "Ali Khan",
      subject: "Mathematics",
      date: "2026-02-01",
      time: "16:00",
      duration: 60,
      status: "completed",
      hasRecording: true,
    },
    {
      id: "4",
      tutorName: "Sara Ahmed",
      subject: "Physics",
      date: "2026-01-28",
      time: "17:00",
      duration: 60,
      status: "completed",
    },
    {
      id: "5",
      tutorName: "Hassan Raza",
      subject: "Chemistry",
      date: "2026-01-25",
      time: "15:00",
      duration: 60,
      status: "cancelled",
    },
  ]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-blue-500/10 text-blue-600">Upcoming</Badge>;
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-600">Cancelled</Badge>;
    }
  };

  const filterSessionsByStatus = (status: string) => {
    return sessions.filter((s) => s.status === status);
  };

  const SessionCard = ({ session }: { session: Session }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={session.tutorAvatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {session.tutorName.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">{session.tutorName}</h4>
              <p className="text-sm text-muted-foreground">{session.subject}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <p className="font-medium">{formatDate(session.date)}</p>
              <p className="text-muted-foreground">{session.time}</p>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{session.duration} min</span>
            </div>
            {getStatusBadge(session.status)}

            {session.status === "upcoming" && (
              <div className="flex items-center gap-2">
                <Button size="sm" className="gap-1">
                  <Video className="w-4 h-4" /> Join
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Reschedule</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {session.status === "completed" && (
              <div className="flex items-center gap-2">
                {session.hasRecording && (
                  <Button variant="outline" size="sm" className="gap-1">
                    <Play className="w-4 h-4" /> Recording
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-1">
                  <Star className="w-4 h-4" /> Rate
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout userType="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Sessions</h1>
            <p className="text-muted-foreground">Manage your tutoring sessions</p>
          </div>
          <Button asChild>
            <Link to="/dashboard/student/find-tutors">Book New Session</Link>
          </Button>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({filterSessionsByStatus("upcoming").length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Past ({filterSessionsByStatus("completed").length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({filterSessionsByStatus("cancelled").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-4">
            {filterSessionsByStatus("upcoming").length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Sessions</h3>
                  <p className="text-muted-foreground mb-4">
                    Book a session with your tutor to get started
                  </p>
                  <Button asChild>
                    <Link to="/dashboard/student/find-tutors">Find Tutors</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filterSessionsByStatus("upcoming").map((session) => (
                <SessionCard key={session.id} session={session} />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-4">
            {filterSessionsByStatus("completed").length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Past Sessions</h3>
                  <p className="text-muted-foreground">
                    Your completed sessions will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              filterSessionsByStatus("completed").map((session) => (
                <SessionCard key={session.id} session={session} />
              ))
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="mt-4 space-y-4">
            {filterSessionsByStatus("cancelled").length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Cancelled Sessions</h3>
                  <p className="text-muted-foreground">
                    Cancelled sessions will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              filterSessionsByStatus("cancelled").map((session) => (
                <SessionCard key={session.id} session={session} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
