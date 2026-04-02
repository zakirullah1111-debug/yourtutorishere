import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, BookOpen, Clock, GraduationCap } from "lucide-react";

interface EnrollmentRequest {
  id: string;
  studentName: string;
  studentInitials: string;
  subject: string;
  currentClass: string | null;
  educationBoard: string | null;
  message: string | null;
  createdAt: string;
}

interface PendingEnrollmentsProps {
  tutorId: string;
  onApproved: () => void;
}

export function PendingEnrollments({ tutorId, onApproved }: PendingEnrollmentsProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!tutorId) return;
    try {
      const { data, error } = await supabase
        .from("enrollment_requests" as any)
        .select("*")
        .eq("tutor_id", tutorId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = (data as any[]).map((r: any) => r.student_user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", userIds);

        const mapped: EnrollmentRequest[] = (data as any[]).map((r: any) => {
          const profile = profiles?.find((p) => p.user_id === r.student_user_id);
          const firstName = profile?.first_name || "Unknown";
          const lastName = profile?.last_name || "";
          return {
            id: r.id,
            studentName: `${firstName} ${lastName}`.trim(),
            studentInitials: `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase(),
            subject: r.subject,
            currentClass: r.current_class,
            educationBoard: r.education_board,
            message: r.message,
            createdAt: r.created_at,
          };
        });
        setRequests(mapped);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("Error fetching enrollment requests:", err);
    } finally {
      setLoading(false);
    }
  }, [tutorId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Listen for realtime inserts
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("enrollment-requests-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "enrollment_requests",
      }, () => {
        fetchRequests();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchRequests]);

  const handleAction = async (enrollmentId: string, action: "approve" | "reject") => {
    setProcessingId(enrollmentId);
    try {
      const { data, error } = await supabase.functions.invoke("approve-enrollment", {
        body: { enrollment_id: enrollmentId, action },
      });
      if (error) throw error;
      toast.success(action === "approve" ? "Student enrolled successfully!" : "Request declined.");
      setRequests((prev) => prev.filter((r) => r.id !== enrollmentId));
      if (action === "approve") onApproved();
    } catch (err) {
      console.error("Enrollment action error:", err);
      toast.error("Failed to process request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading || requests.length === 0) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Pending Enrollment Requests
          <Badge variant="secondary" className="ml-1">{requests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border bg-card"
          >
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {req.studentInitials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-medium">{req.studentName}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> {req.subject}
                </span>
                {req.currentClass && (
                  <span>· {req.currentClass}</span>
                )}
                {req.educationBoard && (
                  <span>· {req.educationBoard}</span>
                )}
              </div>
              {req.message && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2 italic">
                  "{req.message}"
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(req.createdAt).toLocaleDateString("en-PK", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                className="min-h-[44px] sm:min-h-0"
                disabled={processingId === req.id}
                onClick={() => handleAction(req.id, "approve")}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {processingId === req.id ? "..." : "Approve"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] sm:min-h-0"
                disabled={processingId === req.id}
                onClick={() => handleAction(req.id, "reject")}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
