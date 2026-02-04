import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
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

const monthlyEarnings = [
  { month: "Sep", earnings: 45000 },
  { month: "Oct", earnings: 52000 },
  { month: "Nov", earnings: 48000 },
  { month: "Dec", earnings: 61000 },
  { month: "Jan", earnings: 58000 },
  { month: "Feb", earnings: 42000 },
];

const subjectEarnings = [
  { subject: "Mathematics", earnings: 85000, sessions: 42 },
  { subject: "Physics", earnings: 62000, sessions: 31 },
  { subject: "Chemistry", earnings: 45000, sessions: 22 },
];

export default function Earnings() {
  const [timeRange, setTimeRange] = useState("6months");
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      studentName: "Ahmed Khan",
      subject: "Mathematics",
      amount: 6000,
      date: "2026-02-03",
      status: "completed",
      sessions: 4,
    },
    {
      id: "2",
      studentName: "Sara Ali",
      subject: "Physics",
      amount: 4500,
      date: "2026-02-01",
      status: "completed",
      sessions: 3,
    },
    {
      id: "3",
      studentName: "Usman Malik",
      subject: "Chemistry",
      amount: 3000,
      date: "2026-01-30",
      status: "pending",
      sessions: 2,
    },
    {
      id: "4",
      studentName: "Fatima Zahra",
      subject: "Mathematics",
      amount: 7500,
      date: "2026-01-28",
      status: "completed",
      sessions: 5,
    },
    {
      id: "5",
      studentName: "Hassan Raza",
      subject: "Physics",
      amount: 4500,
      date: "2026-01-25",
      status: "processing",
      sessions: 3,
    },
  ]);

  const totalEarnings = 192000;
  const thisMonthEarnings = 42000;
  const pendingAmount = 7500;
  const totalSessions = 95;

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
