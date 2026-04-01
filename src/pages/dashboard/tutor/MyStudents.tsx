import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MessageSquare,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Filter,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  subject: string;
  currentClass: string;
  sessionsCompleted: number;
  lastSession: string;
  nextSession: string | null;
  progress: "improving" | "stable" | "needs-attention";
  gradeAverage: number;
}

export default function MyStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      if (!user) return;

      try {
        // Get tutor record
        const { data: tutorData } = await supabase
          .from("tutors")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!tutorData) {
          setLoading(false);
          return;
        }

        // Fetch students assigned to this tutor
        const { data: studentsData } = await supabase
          .from("students")
          .select("*")
          .eq("assigned_tutor_id", tutorData.id);

        if (studentsData && studentsData.length > 0) {
          const userIds = studentsData.map((s) => s.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", userIds);

          const mappedStudents: Student[] = studentsData.map((student) => {
            const profile = profiles?.find((p) => p.user_id === student.user_id);
            return {
              id: student.id,
              name: profile ? `${profile.first_name} ${profile.last_name?.[0] || ""}.`.trim() : "Unknown",
              email: "",
              subject: student.primary_subject,
              currentClass: student.current_class || "N/A",
              sessionsCompleted: student.total_sessions_completed || 0,
              lastSession: student.last_session_date || "",
              nextSession: student.next_session_date,
              progress: (student.progress_status?.toLowerCase() as "improving" | "stable" | "needs-attention") || "stable",
              gradeAverage: Number(student.current_grade_average) || 0,
            };
          });

          setStudents(mappedStudents);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, [user]);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === "all" || student.subject === subjectFilter;
    const matchesProgress = progressFilter === "all" || student.progress === progressFilter;
    return matchesSearch && matchesSubject && matchesProgress;
  });

  const subjects = [...new Set(students.map((s) => s.subject))];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getProgressBadge = (progress: string) => {
    switch (progress) {
      case "improving":
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            <TrendingUp className="w-3 h-3 mr-1" />
            Improving
          </Badge>
        );
      case "stable":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
            Stable
          </Badge>
        );
      case "needs-attention":
        return (
          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
            <TrendingDown className="w-3 h-3 mr-1" />
            Needs Attention
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout userType="tutor">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">My Students</h1>
          <p className="text-muted-foreground">
            Manage and track your students' progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-xl font-bold">{students.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Improving</p>
                  <p className="text-xl font-bold">
                    {students.filter((s) => s.progress === "improving").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sessions Today</p>
                  <p className="text-xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Need Attention</p>
                  <p className="text-xl font-bold">
                    {students.filter((s) => s.progress === "needs-attention").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Subject" />
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
              <Select value={progressFilter} onValueChange={setProgressFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Progress" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Progress</SelectItem>
                  <SelectItem value="improving">Improving</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="needs-attention">Needs Attention</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Students Table - Desktop */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Grade Avg</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Next Session</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {student.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.subject}</TableCell>
                    <TableCell>{student.currentClass}</TableCell>
                    <TableCell>{student.sessionsCompleted}</TableCell>
                    <TableCell>
                      <span
                        className={
                          student.gradeAverage >= 80
                            ? "text-green-600"
                            : student.gradeAverage >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {student.gradeAverage}%
                      </span>
                    </TableCell>
                    <TableCell>{getProgressBadge(student.progress)}</TableCell>
                    <TableCell>
                      {student.nextSession ? (
                        formatDate(student.nextSession)
                      ) : (
                        <span className="text-muted-foreground">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Calendar className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Students Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {filteredStudents.map((student) => (
            <Card key={student.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {student.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.subject} · {student.currentClass}</p>
                  </div>
                  {getProgressBadge(student.progress)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
                  <div>
                    <p className="font-bold">{student.sessionsCompleted}</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                  <div>
                    <p className={`font-bold ${student.gradeAverage >= 80 ? "text-green-600" : student.gradeAverage >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                      {student.gradeAverage}%
                    </p>
                    <p className="text-xs text-muted-foreground">Grade</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{student.nextSession ? formatDate(student.nextSession) : "—"}</p>
                    <p className="text-xs text-muted-foreground">Next</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 min-h-[44px]">
                    <MessageSquare className="w-4 h-4 mr-1" /> Message
                  </Button>
                  <Button size="sm" className="flex-1 min-h-[44px]">
                    <Calendar className="w-4 h-4 mr-1" /> Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
