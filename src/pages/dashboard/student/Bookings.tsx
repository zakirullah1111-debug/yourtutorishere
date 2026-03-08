import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isAfter, addMinutes } from "date-fns";
import {
  Calendar, Clock, Timer, CreditCard, Video, MessageCircle, Search,
  Star, AlertTriangle, Loader2, X as XIcon,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMessaging } from "@/hooks/useMessaging";

interface Booking {
  id: string;
  tutor_id: string;
  scheduled_date: string;
  scheduled_time: string;
  end_time: string;
  status: string;
  meeting_url: string;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  review_prompted: boolean | null;
  created_at: string | null;
  // joined from profiles + tutors
  tutor_name: string;
  tutor_avatar: string | null;
  tutor_education: string;
  tutor_university: string;
  tutor_user_id: string;
}

type Tab = "upcoming" | "past" | "cancelled";

export default function StudentBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getOrCreateConversation } = useMessaging("student");

  const [tab, setTab] = useState<Tab>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reviewData, setReviewData] = useState<Record<string, { rating: number; comment: string; submitted: boolean }>>({});
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // Tick every 30s for join button state
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: rawBookings } = await supabase
        .from("demo_bookings")
        .select("*")
        .eq("student_id", user.id)
        .order("scheduled_date", { ascending: true });

      if (!rawBookings || rawBookings.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      // Get unique tutor_ids (these are user_ids in demo_bookings)
      const tutorUserIds = [...new Set(rawBookings.map(b => b.tutor_id))];

      const [profilesRes, tutorsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, first_name, last_name, avatar_url").in("user_id", tutorUserIds),
        supabase.from("tutors").select("user_id, education_level, university").in("user_id", tutorUserIds),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
      const tutorMap = new Map((tutorsRes.data || []).map(t => [t.user_id, t]));

      const mapped: Booking[] = rawBookings.map(b => {
        const prof = profileMap.get(b.tutor_id);
        const tut = tutorMap.get(b.tutor_id);
        return {
          ...b,
          tutor_name: prof ? `${prof.first_name} ${prof.last_name}`.trim() : "Tutor",
          tutor_avatar: prof?.avatar_url || null,
          tutor_education: tut?.education_level || "",
          tutor_university: tut?.university || "",
          tutor_user_id: b.tutor_id,
        };
      });

      setBookings(mapped);

      // Check existing reviews for past bookings
      const pastIds = mapped.filter(b => b.review_prompted).map(b => b.id);
      if (pastIds.length > 0) {
        const { data: reviews } = await supabase
          .from("reviews")
          .select("session_id, rating, comment")
          .eq("student_id", user.id);
        // We'll use session_id as booking_id reference if available
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("student-bookings")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "demo_bookings",
        filter: `student_id=eq.${user.id}`,
      }, () => { fetchBookings(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchBookings]);

  const formatTime12 = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const getSessionDatetime = (b: Booking) => {
    return parseISO(`${b.scheduled_date}T${b.scheduled_time}`);
  };

  const getEndDatetime = (b: Booking) => {
    return parseISO(`${b.scheduled_date}T${b.end_time}`);
  };

  const isJoinable = (b: Booking) => {
    const start = getSessionDatetime(b);
    const end = getEndDatetime(b);
    const joinWindow = addMinutes(start, -15);
    const graceEnd = addMinutes(end, 30);
    return isAfter(now, joinWindow) && !isAfter(now, graceEnd);
  };

  const isPastGrace = (b: Booking) => {
    const end = getEndDatetime(b);
    return isAfter(now, addMinutes(end, 30));
  };

  // Filter bookings by tab
  const filtered = bookings.filter(b => {
    if (tab === "upcoming") return b.status === "confirmed" && !isPastGrace(b);
    if (tab === "past") return b.status === "completed" || (b.status === "confirmed" && isPastGrace(b));
    if (tab === "cancelled") return b.status === "cancelled_by_student";
    return false;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    if (tab === "upcoming") return `${a.scheduled_date}${a.scheduled_time}`.localeCompare(`${b.scheduled_date}${b.scheduled_time}`);
    return `${b.scheduled_date}${b.scheduled_time}`.localeCompare(`${a.scheduled_date}${a.scheduled_time}`);
  });

  const handleCancel = async (bookingId: string) => {
    setCancelLoading(true);
    try {
      const res = await supabase.functions.invoke("cancel-booking", {
        body: { booking_id: bookingId, reason: cancelReason || undefined },
      });
      if (res.data?.success) {
        toast({ title: "Session cancelled", description: "The tutor has been notified." });
        setCancellingId(null);
        setCancelReason("");
        fetchBookings();
      } else {
        toast({ title: "Cancellation failed", description: "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Cancellation failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReview = async (booking: Booking) => {
    const data = reviewData[booking.id];
    if (!data || data.rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    setReviewLoading(booking.id);
    try {
      // Find tutor record id
      const { data: tutorRec } = await supabase
        .from("tutors")
        .select("id")
        .eq("user_id", booking.tutor_user_id)
        .single();

      // Find student record id
      const { data: studentRec } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!tutorRec || !studentRec) {
        toast({ title: "Review failed", description: "Profile not found.", variant: "destructive" });
        return;
      }

      const { error: reviewErr } = await supabase.from("reviews").insert({
        tutor_id: tutorRec.id,
        student_id: studentRec.id,
        session_id: null,
        rating: data.rating,
        comment: data.comment || null,
      });

      if (reviewErr) throw reviewErr;

      // Mark review_prompted
      await supabase.from("demo_bookings").update({ review_prompted: true }).eq("id", booking.id);

      setReviewData(prev => ({ ...prev, [booking.id]: { ...prev[booking.id], submitted: true } }));
      toast({ title: "Thanks for your feedback! ⭐" });
      fetchBookings();
    } catch (err) {
      console.error("Review error:", err);
      toast({ title: "Review failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setReviewLoading(null);
    }
  };

  const handleMessage = async (tutorUserId: string) => {
    try {
      await getOrCreateConversation(tutorUserId);
      navigate("/dashboard/student/messages");
    } catch {
      toast({ title: "Error", description: "Could not start conversation.", variant: "destructive" });
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "upcoming", label: "Upcoming", icon: <Calendar className="h-4 w-4" /> },
    { key: "past", label: "Past", icon: <Star className="h-4 w-4" /> },
    { key: "cancelled", label: "Cancelled", icon: <XIcon className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout userType="student">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">My Sessions</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage your demo sessions</p>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted/50 rounded-lg p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i}><CardContent className="p-6"><div className="space-y-3">
                <div className="flex gap-3"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></div>
                <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-10 w-full" />
              </div></CardContent></Card>
            ))}
          </div>
        ) : sortedFiltered.length === 0 ? (
          <EmptyState tab={tab} navigate={navigate} />
        ) : (
          <div className="space-y-4">
            {sortedFiltered.map(booking => (
              <Card key={booking.id}>
                <CardContent className="p-5">
                  {/* Tutor info */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={booking.tutor_avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {booking.tutor_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{booking.tutor_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.tutor_education} · {booking.tutor_university}
                      </p>
                    </div>
                  </div>

                  {/* Session details */}
                  <div className="space-y-1.5 text-sm mb-4">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {format(parseISO(booking.scheduled_date), "EEEE, MMMM d, yyyy")}</div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {formatTime12(booking.scheduled_time)} – {formatTime12(booking.end_time)} (PKT)</div>
                    <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> 30 minutes · <CreditCard className="h-4 w-4 text-primary" /> Free</div>
                    <div className="flex items-center gap-2">
                      Status: {booking.status === "confirmed" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">✅ Confirmed</Badge>
                      ) : booking.status === "cancelled_by_student" ? (
                        <Badge variant="destructive">Cancelled</Badge>
                      ) : (
                        <Badge variant="secondary">Completed</Badge>
                      )}
                    </div>
                  </div>

                  {/* Action buttons — Upcoming */}
                  {tab === "upcoming" && (
                    <>
                      <div className="flex gap-2">
                        {isJoinable(booking) ? (
                          <Button className="flex-1" onClick={() => window.open(booking.meeting_url, "_blank", "noopener,noreferrer")}>
                            <Video className="mr-2 h-4 w-4" /> Join Session
                          </Button>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button className="flex-1" variant="secondary" disabled>
                                <Video className="mr-2 h-4 w-4" /> Join Session
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Available 15 minutes before your session</TooltipContent>
                          </Tooltip>
                        )}
                        <Button variant="outline" className="flex-1" onClick={() => handleMessage(booking.tutor_user_id)}>
                          <MessageCircle className="mr-2 h-4 w-4" /> Message Tutor
                        </Button>
                      </div>

                      {/* Cancel */}
                      {cancellingId === booking.id ? (
                        <div className="mt-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-2">
                          <p className="text-sm font-medium text-foreground">Cancel this session?</p>
                          <Textarea
                            placeholder="Reason (optional): e.g. Schedule conflict, emergency..."
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                            className="text-sm"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => { setCancellingId(null); setCancelReason(""); }}>
                              Keep Session
                            </Button>
                            <Button variant="destructive" size="sm" className="flex-1" disabled={cancelLoading} onClick={() => handleCancel(booking.id)}>
                              {cancelLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                              Yes, Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button className="text-sm text-destructive hover:underline mt-2" onClick={() => setCancellingId(booking.id)}>
                          Cancel Booking
                        </button>
                      )}
                    </>
                  )}

                  {/* Past tab — review */}
                  {tab === "past" && (
                    <>
                      {booking.review_prompted || reviewData[booking.id]?.submitted ? (
                        <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm">
                          ⭐ {reviewData[booking.id]?.submitted
                            ? `You rated this session ${reviewData[booking.id].rating}/5`
                            : "Review submitted"}
                        </div>
                      ) : (
                        <div className="mt-3 p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                          <p className="text-sm font-medium">⭐ How was your session?</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                onClick={() => setReviewData(prev => ({
                                  ...prev,
                                  [booking.id]: { ...prev[booking.id], rating: star, comment: prev[booking.id]?.comment || "", submitted: false },
                                }))}
                                className="p-0.5"
                              >
                                <Star className={`h-7 w-7 transition-colors ${
                                  (reviewData[booking.id]?.rating || 0) >= star
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground hover:text-yellow-400"
                                }`} />
                              </button>
                            ))}
                          </div>
                          <Textarea
                            placeholder="Write a comment... (optional)"
                            maxLength={500}
                            value={reviewData[booking.id]?.comment || ""}
                            onChange={e => setReviewData(prev => ({
                              ...prev,
                              [booking.id]: { ...prev[booking.id], rating: prev[booking.id]?.rating || 0, comment: e.target.value, submitted: false },
                            }))}
                            className="text-sm"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" disabled={reviewLoading === booking.id} onClick={() => handleReview(booking)}>
                              {reviewLoading === booking.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                              Submit Review
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setReviewData(prev => { const copy = { ...prev }; delete copy[booking.id]; return copy; });
                            }}>
                              Skip for now
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Cancelled tab */}
                  {tab === "cancelled" && (
                    <div className="space-y-2 mt-2">
                      {booking.cancellation_reason && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Reason:</span> {booking.cancellation_reason}
                        </p>
                      )}
                      {booking.cancelled_at && (
                        <p className="text-xs text-muted-foreground">
                          Cancelled on {format(parseISO(booking.cancelled_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      )}
                      <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/student/find-tutors")}>
                        <Search className="mr-2 h-4 w-4" /> Find Another Tutor
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function EmptyState({ tab, navigate }: { tab: Tab; navigate: (path: string) => void }) {
  if (tab === "upcoming") return (
    <div className="text-center py-16">
      <Calendar className="h-14 w-14 text-primary/40 mx-auto mb-4" />
      <p className="text-lg font-medium text-foreground">No upcoming sessions</p>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Find a tutor and book your first free 30-minute demo!</p>
      <Button onClick={() => navigate("/dashboard/student/find-tutors")}>Find a Tutor →</Button>
    </div>
  );
  if (tab === "past") return (
    <div className="text-center py-16">
      <Star className="h-14 w-14 text-muted-foreground/40 mx-auto mb-4" />
      <p className="text-lg font-medium text-foreground">No past sessions yet</p>
      <p className="text-sm text-muted-foreground mt-1">Your completed sessions will appear here.</p>
    </div>
  );
  return (
    <div className="text-center py-16">
      <XIcon className="h-14 w-14 text-muted-foreground/40 mx-auto mb-4" />
      <p className="text-lg font-medium text-foreground">No cancelled sessions</p>
    </div>
  );
}
