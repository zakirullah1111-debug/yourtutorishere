import { useState } from "react";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface Transaction {
  id: string;
  studentName: string;
  subject: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "processing";
  sessions: number;
}

export default function Earnings() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("6months");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<{ month: string; earnings: number }[]>([]);
  const [subjectEarnings, setSubjectEarnings] = useState<{ subject: string; earnings: number; sessions: number }[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [thisMonthEarnings, setThisMonthEarnings] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEarnings() {
      if (!user) return;

      try {
        const { data: tutorData } = await supabase
          .from("tutors")
          .select("id, hourly_rate_pkr")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!tutorData) {
          setLoading(false);
          return;
        }

        // Fetch all payments
        const { data: payments } = await supabase
          .from("payments")
          .select("*")
          .eq("tutor_id", tutorData.id)
          .order("created_at", { ascending: false });

        if (payments) {
          const completed = payments.filter((p) => p.payment_status === "Completed");
          const pending = payments.filter((p) => p.payment_status === "Pending" || p.payment_status === "Processing");

          setTotalEarnings(completed.reduce((sum, p) => sum + p.amount_pkr, 0));
          setPendingAmount(pending.reduce((sum, p) => sum + p.amount_pkr, 0));

          // This month
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const thisMonth = completed.filter((p) => new Date(p.created_at) >= startOfMonth);
          setThisMonthEarnings(thisMonth.reduce((sum, p) => sum + p.amount_pkr, 0));

          // Get student names for transactions
          const studentIds = [...new Set(payments.map((p) => p.student_id))];
          const { data: studentRecords } = await supabase.from("students").select("id, user_id, primary_subject").in("id", studentIds);
          const userIds = studentRecords?.map((s) => s.user_id) || [];
          const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);

          const studentMap = new Map();
          studentRecords?.forEach((s) => {
            const profile = profiles?.find((p) => p.user_id === s.user_id);
            studentMap.set(s.id, { name: profile ? `${profile.first_name} ${profile.last_name}` : "Unknown", subject: s.primary_subject });
          });

          setTransactions(
            payments.slice(0, 10).map((p) => {
              const student = studentMap.get(p.student_id);
              return {
                id: p.id,
                studentName: student?.name || "Unknown",
                subject: student?.subject || "N/A",
                amount: p.amount_pkr,
                date: p.payment_date || p.created_at,
                status: (p.payment_status?.toLowerCase() as "completed" | "pending" | "processing") || "pending",
                sessions: p.session_ids?.length || 1,
              };
            })
          );

          // Monthly earnings for chart
          const monthlyData: Record<string, number> = {};
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            monthlyData[months[d.getMonth()]] = 0;
          }
          completed.forEach((p) => {
            const d = new Date(p.created_at);
            const monthName = months[d.getMonth()];
            if (monthlyData[monthName] !== undefined) {
              monthlyData[monthName] += p.amount_pkr;
            }
          });
          setMonthlyEarnings(Object.entries(monthlyData).map(([month, earnings]) => ({ month, earnings })));
        }

        // Fetch sessions for total count
        const { data: sessions } = await supabase
          .from("sessions")
          .select("id, subject, duration_minutes")
          .eq("tutor_id", tutorData.id)
          .eq("status", "Completed");

        if (sessions) {
          setTotalSessions(sessions.length);

          // Subject earnings
          const subjectMap: Record<string, { earnings: number; sessions: number }> = {};
          sessions.forEach((s) => {
            if (!subjectMap[s.subject]) subjectMap[s.subject] = { earnings: 0, sessions: 0 };
            subjectMap[s.subject].sessions++;
            subjectMap[s.subject].earnings += Math.round((s.duration_minutes / 60) * tutorData.hourly_rate_pkr);
          });
          setSubjectEarnings(Object.entries(subjectMap).map(([subject, data]) => ({ subject, ...data })));
        }
      } catch (error) {
        console.error("Error fetching earnings:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEarnings();
  }, [user]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600">Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/10 text-blue-600">Processing</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout userType="tutor">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Earnings</h1>
            <p className="text-muted-foreground">
              Track your income and payment history
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">PKR {totalEarnings.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +12% from last period
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">PKR {thisMonthEarnings.toLocaleString()}</p>
                  <p className="text-xs text-red-600 flex items-center mt-1">
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                    -8% from last month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-xl">
                  <Wallet className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">PKR {pendingAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">2 payments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold">{totalSessions}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ~PKR {Math.round(totalEarnings / totalSessions).toLocaleString()}/session
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Earnings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyEarnings}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip
                      formatter={(value: number) => [`PKR ${value.toLocaleString()}`, "Earnings"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="earnings"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* By Subject */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Earnings by Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectEarnings} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => `${v / 1000}k`} />
                    <YAxis dataKey="subject" type="category" width={100} />
                    <Tooltip
                      formatter={(value: number) => [`PKR ${value.toLocaleString()}`, "Earnings"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.studentName}</TableCell>
                    <TableCell>{transaction.subject}</TableCell>
                    <TableCell>{transaction.sessions}</TableCell>
                    <TableCell className="font-medium">
                      PKR {transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
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
