import { useState } from "react";
import {
  CreditCard,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Payment {
  id: string;
  tutorName: string;
  sessions: number;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
  method?: string;
}

interface PaymentMethod {
  id: string;
  type: "card" | "jazzcash" | "easypaisa" | "bank";
  name: string;
  details: string;
  isDefault: boolean;
}

export default function Payments() {
  const [upcomingPayments] = useState<Payment[]>([
    {
      id: "1",
      tutorName: "Ali Khan",
      sessions: 4,
      amount: 4800,
      date: "2026-02-10",
      status: "pending",
    },
  ]);

  const [paymentHistory] = useState<Payment[]>([
    {
      id: "2",
      tutorName: "Ali Khan",
      sessions: 4,
      amount: 4800,
      date: "2026-01-03",
      status: "completed",
      method: "JazzCash",
    },
    {
      id: "3",
      tutorName: "Sara Ahmed",
      sessions: 3,
      amount: 3000,
      date: "2026-01-02",
      status: "completed",
      method: "Bank Transfer",
    },
    {
      id: "4",
      tutorName: "Ali Khan",
      sessions: 2,
      amount: 2400,
      date: "2025-12-28",
      status: "completed",
      method: "Card",
    },
  ]);

  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "jazzcash",
      name: "JazzCash",
      details: "0300-*****67",
      isDefault: true,
    },
    {
      id: "2",
      type: "card",
      name: "Visa Card",
      details: "**** **** **** 4532",
      isDefault: false,
    },
  ]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500/10 text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/10 text-red-600">
            <AlertCircle className="w-3 h-3 mr-1" /> Failed
          </Badge>
        );
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "jazzcash":
        return "📱";
      case "easypaisa":
        return "📲";
      case "bank":
        return "🏦";
      case "card":
        return "💳";
      default:
        return "💰";
    }
  };

  return (
    <DashboardLayout userType="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Manage your payments and billing</p>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming Payments</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-4">
            {upcomingPayments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">
                    You have no pending payments at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              upcomingPayments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{payment.tutorName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {payment.sessions} sessions
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due: {formatDate(payment.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          PKR {payment.amount.toLocaleString()}
                        </p>
                        <div className="mt-1">{getStatusBadge(payment.status)}</div>
                      </div>
                      <Button>Pay Now</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 font-medium text-muted-foreground">Date</th>
                        <th className="p-4 font-medium text-muted-foreground">Tutor</th>
                        <th className="p-4 font-medium text-muted-foreground">Sessions</th>
                        <th className="p-4 font-medium text-muted-foreground">Method</th>
                        <th className="p-4 font-medium text-muted-foreground">Amount</th>
                        <th className="p-4 font-medium text-muted-foreground">Status</th>
                        <th className="p-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id} className="border-b last:border-0">
                          <td className="p-4">{formatDate(payment.date)}</td>
                          <td className="p-4">{payment.tutorName}</td>
                          <td className="p-4">{payment.sessions}</td>
                          <td className="p-4">{payment.method}</td>
                          <td className="p-4 font-medium">
                            PKR {payment.amount.toLocaleString()}
                          </td>
                          <td className="p-4">{getStatusBadge(payment.status)}</td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4 mr-1" /> Receipt
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methods" className="mt-4 space-y-4">
            {paymentMethods.map((method) => (
              <Card key={method.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{getMethodIcon(method.type)}</div>
                      <div>
                        <h4 className="font-medium">{method.name}</h4>
                        <p className="text-sm text-muted-foreground">{method.details}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" className="w-full gap-2">
              <Plus className="w-4 h-4" /> Add Payment Method
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
