import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isAfter, addMinutes } from "date-fns";
import {
  Calendar, Clock, Timer, CreditCard, Video, MessageCircle,
  Star, Loader2, X as XIcon, Settings,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useSessionCompletion } from "@/hooks/useSessionCompletion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMessaging } from "@/hooks/useMessaging";

interface Booking {
  id: string;
  student_id: string;
  scheduled_date: string;
  scheduled_time: string;
  end_time: string;
  status: string;
  meeting_url: string;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  review_prompted: boolean | null;
  student_name: string;
  student_avatar: string | null;
  student_user_id: string;
  // review info
  review_rating?: number | null;
  review_comment?: string | null;
}

type Tab = "upcoming" | "past" | "cancelled";

export default function TutorBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getOrCreateConversation } = useMessaging("tutor");

  const [tab, setTab] = useState<Tab>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

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
        .eq("tutor_id", user.id)
        .order("scheduled_date", { ascending: true });

      if (!rawBookings || rawBookings.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const studentUserIds = [...new Set(rawBookings.map(b => b.student_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, avatar_url")
        .in("user_id", studentUserIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      // Fetch reviews for these bookings
      const bookingIds = rawBookings.filter(b => b.review_prompted).map(b => b.id);

      const mapped: Booking[] = rawBookings.map(b => {
        const prof = profileMap.get(b.student_id);
        return {
          ...b,
          student_name: prof ? `${prof.first_name} ${prof.last_name}`.trim() : "Student",
          student_avatar: prof?.avatar_url || null,
          student_user_id: b.student_id,
        };
      });

      setBookings(mapped);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("tutor-bookings")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "demo_bookings",
        filter: `tutor_id=eq.${user.id}`,
      }, () => { fetchBookings(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchBookings]);

  const formatTime12 = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const getSessionDatetime = (b: Booking) => parseISO(`${b.scheduled_date}T${b.scheduled_time}`);
  const getEndDatetime = (b: Booking) => parseISO(`${b.scheduled_date}T${b.end_time}`);

  const isJoinable = (b: Booking) => {
    const start = getSessionDatetime(b);
    const end = getEndDatetime(b);
    return isAfter(now, addMinutes(start, -15)) && !isAfter(now, addMinutes(end, 30));
  };

  const isPastGrace = (b: Booking) => isAfter(now, addMinutes(getEndDatetime(b), 30));

  const filtered = bookings.filter(b => {
    if (tab === "upcoming") return b.status === "confirmed" && !isPastGrace(b);
    if (tab === "past") return b.status === "completed" || (b.status === "confirmed" && isPastGrace(b));
    if (tab === "cancelled") return b.status === "cancelled_by_student";
    return false;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (tab === "upcoming") return `${a.scheduled_date}${a.scheduled_time}`.localeCompare(`${b.scheduled_date}${b.scheduled_time}`);
    return `${b.scheduled_date}${b.scheduled_time}`.localeCompare(`${a.scheduled_date}${a.scheduled_time}`);
  });

  const handleMessage = async (studentUserId: string) => {
    try {
      await getOrCreateConversation(studentUserId);
      navigate("/dashboard/tutor/messages");
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
    <DashboardLayout userType="tutor">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
        <p className="text-sm text-muted-foreground mb-6">Your demo session schedule</p>

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

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i}><CardContent className="p-6"><div className="space-y-3">
                <div className="flex gap-3"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></div>
                <Skeleton className="h-4 w-full" /><Skeleton className="h-10 w-full" />
              </div></CardContent></Card>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <TutorEmptyState tab={tab} navigate={navigate} />
        ) : (
          <div className="space-y-4">
            {sorted.map(booking => (
              <Card key={booking.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={booking.student_avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {booking.student_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{booking.student_name}</p>
                      <p className="text-xs text-muted-foreground">Student</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm mb-4">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {format(parseISO(booking.scheduled_date), "EEEE, MMMM d, yyyy")}</div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {formatTime12(booking.scheduled_time)} – {formatTime12(booking.end_time)} (PKT)</div>
                    <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> 30 minutes · <CreditCard className="h-4 w-4 text-primary" /> Free</div>
                    <div className="flex items-center gap-2">
                      Status: {booking.status === "confirmed" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">✅ Confirmed</Badge>
                      ) : booking.status === "cancelled_by_student" ? (
                        <Badge variant="destructive">Cancelled by student</Badge>
                      ) : (
                        <Badge variant="secondary">Completed</Badge>
                      )}
                    </div>
                  </div>

                  {tab === "upcoming" && (
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
                          <TooltipContent>Available 15 minutes before the session</TooltipContent>
                        </Tooltip>
                      )}
                      <Button variant="outline" className="flex-1" onClick={() => handleMessage(booking.student_user_id)}>
                        <MessageCircle className="mr-2 h-4 w-4" /> Message Student
                      </Button>
                    </div>
                  )}

                  {tab === "past" && (
                    <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm">
                      {booking.review_prompted ? (
                        <span>⭐ Student left a review</span>
                      ) : (
                        <span className="text-muted-foreground">No review left yet</span>
                      )}
                    </div>
                  )}

                  {tab === "cancelled" && (
                    <div className="space-y-1 mt-2 text-sm">
                      {booking.cancellation_reason && (
                        <p className="text-muted-foreground"><span className="font-medium">Reason:</span> {booking.cancellation_reason}</p>
                      )}
                      {booking.cancelled_at && (
                        <p className="text-xs text-muted-foreground">
                          Cancelled on {format(parseISO(booking.cancelled_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      )}
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

function TutorEmptyState({ tab, navigate }: { tab: Tab; navigate: (path: string) => void }) {
  if (tab === "upcoming") return (
    <div className="text-center py-16">
      <Calendar className="h-14 w-14 text-primary/40 mx-auto mb-4" />
      <p className="text-lg font-medium text-foreground">No upcoming sessions</p>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Make sure your availability is set so students can book!</p>
      <Button onClick={() => navigate("/dashboard/tutor/settings")}>
        <Settings className="mr-2 h-4 w-4" /> Set My Availability
      </Button>
    </div>
  );
  if (tab === "past") return (
    <div className="text-center py-16">
      <Star className="h-14 w-14 text-muted-foreground/40 mx-auto mb-4" />
      <p className="text-lg font-medium text-foreground">No past sessions yet</p>
    </div>
  );
  return (
    <div className="text-center py-16">
      <XIcon className="h-14 w-14 text-muted-foreground/40 mx-auto mb-4" />
      <p className="text-lg font-medium text-foreground">No cancelled sessions</p>
    </div>
  );
}
