import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isAfter, addMinutes, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, isBefore, isToday, startOfDay } from "date-fns";
import {
  Calendar, Clock, Timer, CreditCard, Video, MessageCircle,
  Star, Loader2, X as XIcon, Settings, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Inbox, AlertTriangle,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSessionCompletion } from "@/hooks/useSessionCompletion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMessaging } from "@/hooks/useMessaging";
import { cn } from "@/lib/utils";

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
  request_message: string | null;
  rejected_reason: string | null;
  created_at: string | null;
  student_name: string;
  student_avatar: string | null;
  student_user_id: string;
  review_rating?: number | null;
  review_comment?: string | null;
}

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

type Tab = "requests" | "upcoming" | "past" | "cancelled";

export default function TutorBookings() {
  const { user } = useAuth();
  useSessionCompletion();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getOrCreateConversation } = useMessaging("tutor");

  const [tab, setTab] = useState<Tab>("requests");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Approve modal state
  const [approveBooking, setApproveBooking] = useState<Booking | null>(null);
  const [approveDate, setApproveDate] = useState<Date | null>(null);
  const [approveSlot, setApproveSlot] = useState<string | null>(null);
  const [approveStep, setApproveStep] = useState<"date" | "time">("date");
  const [approveLoading, setApproveLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [existingBookings, setExistingBookings] = useState<{ scheduled_date: string; scheduled_time: string }[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Decline state
  const [declineBooking, setDeclineBooking] = useState<Booking | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declineLoading, setDeclineLoading] = useState(false);

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
        .order("created_at", { ascending: false });

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

  const pendingRequests = bookings.filter(b => b.status === "pending");

  const filtered = bookings.filter(b => {
    if (tab === "requests") return b.status === "pending";
    if (tab === "upcoming") return b.status === "confirmed" && !isPastGrace(b);
    if (tab === "past") return b.status === "completed" || (b.status === "confirmed" && isPastGrace(b));
    if (tab === "cancelled") return b.status === "cancelled_by_student" || b.status === "rejected";
    return false;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (tab === "requests") return (b.created_at || "").localeCompare(a.created_at || "");
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

  // ─── Approve flow ───
  const openApprove = async (booking: Booking) => {
    setApproveBooking(booking);
    setApproveDate(null);
    setApproveSlot(null);
    setApproveStep("date");
    setCurrentMonth(new Date());

    if (!user) return;
    const [availRes, bookingsRes] = await Promise.all([
      supabase.from("tutor_availability").select("day_of_week, start_time, end_time").eq("tutor_id", user.id).eq("is_active", true),
      supabase.from("demo_bookings").select("scheduled_date, scheduled_time").eq("tutor_id", user.id).eq("status", "confirmed"),
    ]);
    setAvailability(availRes.data || []);
    setExistingBookings(bookingsRes.data || []);
  };

  const handleApprove = async () => {
    if (!approveBooking || !approveDate || !approveSlot) return;
    setApproveLoading(true);
    try {
      const res = await supabase.functions.invoke("approve-demo", {
        body: {
          booking_id: approveBooking.id,
          scheduled_date: format(approveDate, "yyyy-MM-dd"),
          scheduled_time: approveSlot,
        },
      });
      if (res.data?.success) {
        toast({ title: "Demo approved! ✅", description: "The student has been notified." });
        setApproveBooking(null);
        fetchBookings();
      } else {
        toast({ title: "Approval failed", description: res.data?.error || "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setApproveLoading(false);
    }
  };

  // ─── Decline flow ───
  const handleDecline = async () => {
    if (!declineBooking) return;
    setDeclineLoading(true);
    try {
      const res = await supabase.functions.invoke("reject-demo", {
        body: {
          booking_id: declineBooking.id,
          reason: declineReason.trim() || undefined,
        },
      });
      if (res.data?.success) {
        toast({ title: "Request declined", description: "The student has been notified." });
        setDeclineBooking(null);
        setDeclineReason("");
        fetchBookings();
      } else {
        toast({ title: "Failed", description: res.data?.error || "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setDeclineLoading(false);
    }
  };

  // ─── Calendar logic for approve modal ───
  const today = startOfDay(new Date());
  const availableDaysSet = useMemo(() => new Set(availability.map(a => a.day_of_week)), [availability]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentMonth]);

  const firstDayOffset = useMemo(() => {
    const firstDay = getDay(calendarDays[0]);
    return firstDay === 0 ? 6 : firstDay - 1;
  }, [calendarDays]);

  const generateSlotsForDate = (date: Date): string[] => {
    const dayOfWeek = getDay(date);
    const dayAvail = availability.filter(a => a.day_of_week === dayOfWeek);
    const slots: string[] = [];
    for (const a of dayAvail) {
      const [startH, startM] = a.start_time.split(":").map(Number);
      const [endH, endM] = a.end_time.split(":").map(Number);
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;
      for (let m = startMins; m + 30 <= endMins; m += 30) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        slots.push(`${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`);
      }
    }
    return slots;
  };

  const isDateAvailable = (date: Date) => {
    if (isBefore(date, today) || isToday(date)) return false;
    const dayOfWeek = getDay(date);
    if (!availableDaysSet.has(dayOfWeek)) return false;
    const dateStr = format(date, "yyyy-MM-dd");
    const daySlots = generateSlotsForDate(date);
    const bookedForDate = existingBookings.filter(b => b.scheduled_date === dateStr);
    const bookedTimes = new Set(bookedForDate.map(b => b.scheduled_time));
    return daySlots.some(s => !bookedTimes.has(s + ":00"));
  };

  const slotsForApproveDate = useMemo(() => {
    if (!approveDate) return [];
    const dateStr = format(approveDate, "yyyy-MM-dd");
    const allSlots = generateSlotsForDate(approveDate);
    const bookedForDate = existingBookings.filter(b => b.scheduled_date === dateStr);
    const bookedTimes = new Set(bookedForDate.map(b => b.scheduled_time));
    return allSlots.map(s => ({ time: s, booked: bookedTimes.has(s + ":00") }));
  }, [approveDate, existingBookings, availability]);

  const addMinutesToTime = (time24: string, mins: number) => {
    const [h, m] = time24.split(":").map(Number);
    const total = h * 60 + m + mins;
    const newH = Math.floor(total / 60) % 24;
    const newM = total % 60;
    return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
  };

  const canGoPrev = startOfMonth(currentMonth).getTime() > startOfMonth(new Date()).getTime();
  const canGoNext = startOfMonth(currentMonth).getTime() < startOfMonth(addMonths(new Date(), 2)).getTime();
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "requests", label: "Requests", icon: <Inbox className="h-4 w-4" />, badge: pendingRequests.length },
    { key: "upcoming", label: "Upcoming", icon: <Calendar className="h-4 w-4" /> },
    { key: "past", label: "Past", icon: <Star className="h-4 w-4" /> },
    { key: "cancelled", label: "Cancelled", icon: <XIcon className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout userType="tutor">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
        <p className="text-sm text-muted-foreground mb-6">Your demo session schedule</p>

        <div className="flex gap-1 mb-6 bg-muted/50 rounded-lg p-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
              {t.badge && t.badge > 0 ? (
                <span className="ml-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{t.badge}</span>
              ) : null}
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
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{booking.student_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tab === "requests" && booking.created_at
                          ? `Requested ${format(parseISO(booking.created_at), "MMM d, yyyy 'at' h:mm a")}`
                          : "Student"}
                      </p>
                    </div>
                    {tab === "requests" && (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">⏳ Pending</Badge>
                    )}
                  </div>

                  {/* Request message */}
                  {tab === "requests" && booking.request_message && (
                    <div className="p-3 rounded-lg bg-muted/50 text-sm text-foreground mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Student's message:</p>
                      {booking.request_message}
                    </div>
                  )}

                  {/* Session details for non-pending */}
                  {tab !== "requests" && booking.scheduled_date !== "1970-01-01" && (
                    <div className="space-y-1.5 text-sm mb-4">
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {format(parseISO(booking.scheduled_date), "EEEE, MMMM d, yyyy")}</div>
                      <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {formatTime12(booking.scheduled_time)} – {formatTime12(booking.end_time)} (PKT)</div>
                      <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> 30 minutes · <CreditCard className="h-4 w-4 text-primary" /> Free</div>
                      <div className="flex items-center gap-2">
                        Status: {booking.status === "confirmed" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">✅ Confirmed</Badge>
                        ) : booking.status === "cancelled_by_student" ? (
                          <Badge variant="destructive">Cancelled by student</Badge>
                        ) : booking.status === "rejected" ? (
                          <Badge variant="destructive">Declined</Badge>
                        ) : (
                          <Badge variant="secondary">Completed</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Requests tab actions */}
                  {tab === "requests" && (
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => openApprove(booking)}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                      </Button>
                      <Button variant="destructive" className="flex-1" onClick={() => { setDeclineBooking(booking); setDeclineReason(""); }}>
                        <XCircle className="mr-2 h-4 w-4" /> Decline
                      </Button>
                    </div>
                  )}

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
                      {(booking.cancellation_reason || booking.rejected_reason) && (
                        <p className="text-muted-foreground"><span className="font-medium">Reason:</span> {booking.cancellation_reason || booking.rejected_reason}</p>
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

      {/* ─── Approve Modal ─── */}
      <Dialog open={!!approveBooking} onOpenChange={(v) => { if (!v) setApproveBooking(null); }}>
        <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
          <div className="px-6 pt-5 pb-3">
            <DialogHeader>
              <DialogTitle>Approve Demo Request</DialogTitle>
              <DialogDescription>
                Select a date and time for the session with {approveBooking?.student_name}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto">
            {approveStep === "date" ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Button variant="ghost" size="icon" disabled={!canGoPrev} onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-semibold">{format(currentMonth, "MMMM yyyy")}</span>
                  <Button variant="ghost" size="icon" disabled={!canGoNext} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {weekDays.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e-${i}`} />)}
                  {calendarDays.map(date => {
                    const avail = isDateAvailable(date);
                    const selected = approveDate && format(approveDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
                    return (
                      <button
                        key={date.toISOString()}
                        disabled={!avail}
                        onClick={() => { setApproveDate(date); setApproveSlot(null); }}
                        className={cn(
                          "relative h-10 w-full rounded-lg text-sm transition-colors flex items-center justify-center",
                          selected ? "bg-primary text-primary-foreground font-bold" :
                          avail ? "hover:bg-primary/10 text-foreground cursor-pointer" :
                          "text-muted-foreground/40 cursor-default"
                        )}
                      >
                        {date.getDate()}
                        {avail && !selected && <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-primary" />}
                      </button>
                    );
                  })}
                </div>
                {availability.length === 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mt-4">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">You haven't set your availability yet. Go to Schedule settings first.</p>
                  </div>
                )}
                <Button className="w-full mt-4" disabled={!approveDate} onClick={() => setApproveStep("time")}>
                  Next: Choose Time <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <button className="text-sm text-primary hover:underline flex items-center gap-1 mb-3" onClick={() => setApproveStep("date")}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Change Date
                </button>
                <h3 className="text-base font-semibold mb-1">Available Times</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {approveDate && format(approveDate, "EEEE, MMMM d, yyyy")}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {slotsForApproveDate.map(({ time, booked }) => {
                    const selected = approveSlot === time;
                    const endTime = addMinutesToTime(time, 30);
                    return (
                      <button
                        key={time}
                        disabled={booked}
                        onClick={() => setApproveSlot(time)}
                        className={cn(
                          "p-3 rounded-lg border text-sm transition-all",
                          selected ? "border-primary bg-primary/10 text-primary font-semibold" :
                          booked ? "border-border bg-muted/50 text-muted-foreground/50 cursor-not-allowed line-through" :
                          "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                        )}
                      >
                        {formatTime12(time)} – {formatTime12(endTime)}
                      </button>
                    );
                  })}
                </div>
                <Button className="w-full mt-4" disabled={!approveSlot || approveLoading} onClick={handleApprove}>
                  {approveLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {approveLoading ? "Approving..." : "Confirm & Approve"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Decline Modal ─── */}
      <Dialog open={!!declineBooking} onOpenChange={(v) => { if (!v) setDeclineBooking(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Decline Demo Request</DialogTitle>
            <DialogDescription>
              Let {declineBooking?.student_name} know why you're declining (optional).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason (optional)..."
            value={declineReason}
            onChange={e => setDeclineReason(e.target.value.slice(0, 500))}
            rows={3}
            className="resize-none"
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeclineBooking(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" disabled={declineLoading} onClick={handleDecline}>
              {declineLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              {declineLoading ? "Declining..." : "Decline Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function TutorEmptyState({ tab, navigate }: { tab: Tab; navigate: (path: string) => void }) {
  if (tab === "requests") return (
    <div className="text-center py-16">
      <Inbox className="h-14 w-14 text-primary/40 mx-auto mb-4" />
      <p className="text-lg font-medium text-foreground">No pending requests</p>
      <p className="text-sm text-muted-foreground mt-1">New demo requests from students will appear here.</p>
    </div>
  );
  if (tab === "upcoming") return (
    <div className="text-center py-16">
      <Calendar className="h-14 w-14 text-primary/40 mx-auto mb-4" />
      <p className="text-lg font-medium text-foreground">No upcoming sessions</p>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Approve pending requests to schedule sessions!</p>
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
