import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for students
    const mockStudents: Student[] = [
      {
        id: "1",
        name: "Ahmed Khan",
        email: "ahmed.khan@email.com",
        subject: "Mathematics",
        currentClass: "Grade 10",
        sessionsCompleted: 15,
        lastSession: "2026-02-02",
        nextSession: "2026-02-05",
        progress: "improving",
        gradeAverage: 85,
      },
      {
        id: "2",
        name: "Sara Ali",
        email: "sara.ali@email.com",
        subject: "Physics",
        currentClass: "Grade 11",
        sessionsCompleted: 12,
        lastSession: "2026-02-01",
        nextSession: "2026-02-05",
        progress: "stable",
        gradeAverage: 78,
      },
      {
        id: "3",
        name: "Usman Malik",
        email: "usman.malik@email.com",
        subject: "Chemistry",
        currentClass: "Grade 12",
        sessionsCompleted: 8,
        lastSession: "2026-01-30",
        nextSession: "2026-02-06",
        progress: "needs-attention",
        gradeAverage: 65,
      },
      {
        id: "4",
        name: "Fatima Zahra",
        email: "fatima.z@email.com",
        subject: "Mathematics",
        currentClass: "Grade 9",
        sessionsCompleted: 20,
        lastSession: "2026-02-03",
        nextSession: null,
        progress: "improving",
        gradeAverage: 92,
      },
      {
        id: "5",
        name: "Hassan Raza",
        email: "hassan.r@email.com",
        subject: "Physics",
        currentClass: "Grade 10",
        sessionsCompleted: 6,
        lastSession: "2026-01-28",
        nextSession: "2026-02-07",
        progress: "stable",
        gradeAverage: 72,
      },
    ];

    setStudents(mockStudents);
    setLoading(false);
  }, []);

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

        {/* Students Table */}
        <Card>
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
      </div>
    </DashboardLayout>
  );
}
