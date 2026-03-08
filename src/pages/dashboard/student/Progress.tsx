import { useState } from "react";
import { TrendingUp, BookOpen, Award, Target } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubjectProgress {
  subject: string;
  currentGrade: number;
  previousGrade: number;
  sessions: number;
  status: "Excellent" | "Good" | "Needs Improvement";
}

export default function Progress() {
  const [timeRange, setTimeRange] = useState("3months");
  const [subjectProgress] = useState<SubjectProgress[]>([
    {
      subject: "Mathematics",
      currentGrade: 88,
      previousGrade: 76,
      sessions: 15,
      status: "Excellent",
    },
    {
      subject: "Physics",
      currentGrade: 76,
      previousGrade: 71,
      sessions: 12,
      status: "Good",
    },
    {
      subject: "Chemistry",
      currentGrade: 82,
      previousGrade: 80,
      sessions: 10,
      status: "Good",
    },
  ]);

  const [achievements] = useState([
    { id: "1", title: "Fast Learner", description: "Completed 10 sessions", icon: "🚀" },
    { id: "2", title: "Math Wizard", description: "Scored 90%+ in Mathematics", icon: "🧮" },
    { id: "3", title: "Consistent", description: "Attended 5 sessions in a row", icon: "🎯" },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Excellent":
        return "bg-green-500/10 text-green-600";
      case "Good":
        return "bg-blue-500/10 text-blue-600";
      default:
        return "bg-yellow-500/10 text-yellow-600";
    }
  };

  const getProgressChange = (current: number, previous: number) => {
    const change = current - previous;
    if (change > 0) return `+${change}%`;
    if (change < 0) return `${change}%`;
    return "0%";
  };

  return (
    <DashboardLayout userType="student">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">My Progress</h1>
            <p className="text-muted-foreground">Track your learning journey</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-40 min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Grade</p>
                  <p className="text-2xl font-bold">82%</p>
                  <p className="text-sm text-green-500">+8% from last period</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold">37</p>
                  <p className="text-sm text-muted-foreground">55.5 hours</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-sm text-muted-foreground">badges earned</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Award className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Goals Met</p>
                  <p className="text-2xl font-bold">5/7</p>
                  <p className="text-sm text-muted-foreground">this month</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10">
                  <Target className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subjectProgress.map((subject) => (
                  <div key={subject.subject} className="p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{subject.subject}</h4>
                      <Badge className={getStatusColor(subject.status)}>{subject.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{subject.sessions} sessions</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{subject.currentGrade}%</span>
                        <span
                          className={`text-sm ${
                            subject.currentGrade > subject.previousGrade
                              ? "text-green-500"
                              : subject.currentGrade < subject.previousGrade
                              ? "text-red-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {getProgressChange(subject.currentGrade, subject.previousGrade)}
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${subject.currentGrade}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50"
                  >
                    <div className="text-3xl">{achievement.icon}</div>
                    <div>
                      <h4 className="font-medium">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI Insights</h3>
                <p className="text-muted-foreground">
                  Based on your progress, we recommend focusing on <strong>Physics</strong> equations 
                  and problem-solving techniques. Your improvement in Mathematics is excellent! 
                  Consider scheduling 2 more Physics sessions this week to maintain momentum.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
