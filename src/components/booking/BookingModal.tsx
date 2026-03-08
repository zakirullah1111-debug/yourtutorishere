import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, isBefore, isToday, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Check, Calendar, Clock, User, Timer, CreditCard, Video, X, Loader2, CheckCircle2, MessageCircle, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMessaging } from "@/hooks/useMessaging";

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutor: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    education_level: string;
    university: string;
  };
}

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

type Step = 1 | 2 | 3 | "success";

export function BookingModal({ open, onOpenChange, tutor }: BookingModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getOrCreateConversation } = useMessaging("student");

  const [step, setStep] = useState<Step>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [existingBookings, setExistingBookings] = useState<{ scheduled_date: string; scheduled_time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [slotWarning, setSlotWarning] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<{ meeting_url: string; booking_id: string } | null>(null);

  const tutorName = `${tutor.first_name} ${tutor.last_name}`.trim();
  const initials = `${tutor.first_name[0] || ""}${tutor.last_name[0] || ""}`.toUpperCase();

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedDate(null);
      setSelectedSlot(null);
      setSlotWarning(null);
      setBookingResult(null);
      setCurrentMonth(new Date());
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [availRes, tutorRes, bookingsRes] = await Promise.all([
        supabase.from("tutor_availability").select("day_of_week, start_time, end_time").eq("tutor_id", tutor.user_id).eq("is_active", true),
        supabase.from("tutors").select("blocked_dates").eq("user_id", tutor.user_id).single(),
        supabase.from("demo_bookings").select("scheduled_date, scheduled_time").eq("tutor_id", tutor.user_id).eq("status", "confirmed"),
      ]);
      setAvailability(availRes.data || []);
      setBlockedDates((tutorRes.data?.blocked_dates as string[]) || []);
      setExistingBookings(bookingsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch booking data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calendar helpers
  const today = startOfDay(new Date());
  const minMonth = startOfMonth(new Date());
  const maxMonth = startOfMonth(addMonths(new Date(), 2));

  const canGoPrev = startOfMonth(currentMonth).getTime() > minMonth.getTime();
  const canGoNext = startOfMonth(currentMonth).getTime() < maxMonth.getTime();

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentMonth]);

  // Map JS getDay (0=Sun) to availability day_of_week (0=Sun)
  const availableDaysSet = useMemo(() => new Set(availability.map(a => a.day_of_week)), [availability]);

  const isDateAvailable = (date: Date) => {
    if (isBefore(date, today) || isToday(date)) return false;
    const dayOfWeek = getDay(date);
    if (!availableDaysSet.has(dayOfWeek)) return false;
    const dateStr = format(date, "yyyy-MM-dd");
    if (blockedDates.includes(dateStr)) return false;
    // Check if at least one slot is free
    const daySlots = generateSlotsForDate(date);
    const bookedForDate = existingBookings.filter(b => b.scheduled_date === dateStr);
    const bookedTimes = new Set(bookedForDate.map(b => b.scheduled_time));
    return daySlots.some(s => !bookedTimes.has(s + ":00"));
  };

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

  const formatTime12 = (time24: string) => {
    const [h, m] = time24.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const addMinutesToTime = (time24: string, mins: number) => {
    const [h, m] = time24.split(":").map(Number);
    const total = h * 60 + m + mins;
    const newH = Math.floor(total / 60) % 24;
    const newM = total % 60;
    return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
  };

  // Slots for selected date
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const allSlots = generateSlotsForDate(selectedDate);
    const bookedForDate = existingBookings.filter(b => b.scheduled_date === dateStr);
    const bookedTimes = new Set(bookedForDate.map(b => b.scheduled_time));
    return allSlots.map(s => ({
      time: s,
      booked: bookedTimes.has(s + ":00"),
    }));
  }, [selectedDate, existingBookings, availability]);

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedSlot) return;
    setBooking(true);
    setSlotWarning(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("create-booking", {
        body: {
          tutor_id: tutor.user_id,
          scheduled_date: format(selectedDate, "yyyy-MM-dd"),
          scheduled_time: selectedSlot,
        },
      });

      if (res.error) {
        const parsed = typeof res.error === "string" ? JSON.parse(res.error) : res.error;
        if (parsed?.error === "slot_taken" || res.error?.message?.includes("slot_taken")) {
          setSlotWarning("That slot was just taken by another student. Please choose a different time.");
          setStep(2);
          setSelectedSlot(null);
          // Refresh bookings
          const { data } = await supabase.from("demo_bookings").select("scheduled_date, scheduled_time").eq("tutor_id", tutor.user_id).eq("status", "confirmed");
          setExistingBookings(data || []);
        } else {
          toast({ title: "Booking failed", description: "Please try again.", variant: "destructive" });
        }
        return;
      }

      const result = res.data;
      if (result?.success) {
        setBookingResult({ meeting_url: result.meeting_url, booking_id: result.booking_id });
        setStep("success");
      } else if (result?.error === "slot_taken") {
        setSlotWarning("That slot was just taken by another student. Please choose a different time.");
        setStep(2);
        setSelectedSlot(null);
        const { data } = await supabase.from("demo_bookings").select("scheduled_date, scheduled_time").eq("tutor_id", tutor.user_id).eq("status", "confirmed");
        setExistingBookings(data || []);
      } else {
        toast({ title: "Booking failed", description: "Please try again.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Booking error:", err);
      toast({ title: "Booking failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  const handleMessageTutor = async () => {
    try {
      await getOrCreateConversation(tutor.user_id);
      onOpenChange(false);
      navigate("/dashboard/student/messages");
    } catch {
      toast({ title: "Error", description: "Could not start conversation.", variant: "destructive" });
    }
  };

  // Monday-first week header (full on desktop, single letter on mobile)
  const weekDaysFull = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekDaysShort = ["M", "T", "W", "T", "F", "S", "S"];

  // Get offset for first day (Monday = 0)
  const firstDayOffset = useMemo(() => {
    const firstDay = getDay(calendarDays[0]); // 0=Sun
    return firstDay === 0 ? 6 : firstDay - 1;
  }, [calendarDays]);

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 py-3">
      {[1, 2, 3].map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
            (step === "success" || (typeof step === "number" && s <= step))
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}>
            {s}
          </div>
          {i < 2 && (
            <div className={cn(
              "w-8 h-0.5 rounded-full transition-colors",
              (step === "success" || (typeof step === "number" && s < step))
                ? "bg-primary"
                : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (step !== "success" || !v) onOpenChange(v); }}>
      <DialogContent
        className={cn(
          "sm:max-w-[520px] p-0 gap-0 overflow-hidden",
          "max-sm:w-screen max-sm:h-screen max-sm:max-w-none max-sm:rounded-none max-sm:border-0"
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-full max-h-[90vh] max-sm:max-h-screen">
          {/* Step labels */}
          <div className="px-6 pt-4 pb-0">
            {stepIndicator}
            <div className="flex justify-between text-[11px] text-muted-foreground px-1 -mt-1 mb-2">
              <span>Select Date</span>
              <span>Choose Time</span>
              <span>Confirm</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : step === 1 ? (
              /* STEP 1 — SELECT DATE */
              <div>
                <h3 className="text-lg font-bold text-foreground">Book a Demo with {tutor.first_name}</h3>
                <p className="text-sm text-muted-foreground mb-4">Select an available date</p>

                {/* Calendar navigation */}
                <div className="flex items-center justify-between mb-3">
                  <Button variant="ghost" size="icon" disabled={!canGoPrev} onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-semibold text-foreground">{format(currentMonth, "MMMM yyyy")}</span>
                  <Button variant="ghost" size="icon" disabled={!canGoNext} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Week header */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {weekDays.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                </div>

                {/* Date grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`empty-${i}`} />)}
                  {calendarDays.map(date => {
                    const available = isDateAvailable(date);
                    const isSelected = selectedDate && format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
                    const isPast = isBefore(date, today) || isToday(date);

                    return (
                      <button
                        key={date.toISOString()}
                        disabled={!available}
                        onClick={() => { setSelectedDate(date); setSelectedSlot(null); setSlotWarning(null); }}
                        className={cn(
                          "relative h-10 w-full rounded-lg text-sm transition-colors flex flex-col items-center justify-center",
                          isSelected ? "bg-primary text-primary-foreground font-bold" :
                          available ? "hover:bg-primary/10 text-foreground cursor-pointer" :
                          isPast ? "text-muted-foreground/40 cursor-default" :
                          "text-muted-foreground/60 cursor-default"
                        )}
                      >
                        {date.getDate()}
                        {available && !isSelected && (
                          <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                        {isToday(date) && !isSelected && (
                          <span className="absolute inset-0 rounded-lg border-2 border-primary/30" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Available</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border-2 border-primary/30" /> Today</span>
                </div>

                {/* Footer */}
                <div className="mt-6">
                  <Button className="w-full" disabled={!selectedDate} onClick={() => setStep(2)}>
                    Next: Choose Time <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : step === 2 ? (
              /* STEP 2 — SELECT TIME */
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <button className="text-sm text-primary hover:underline flex items-center gap-1" onClick={() => { setStep(1); setSlotWarning(null); }}>
                    <ChevronLeft className="h-3.5 w-3.5" /> Change Date
                  </button>
                </div>
                <h3 className="text-lg font-bold text-foreground">Available Times</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                </p>

                {slotWarning && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{slotWarning}</p>
                  </div>
                )}

                {slotsForSelectedDate.every(s => s.booked) ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No available times on this date.</p>
                    <p className="text-xs text-muted-foreground mt-1">Please go back and choose another day.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setStep(1)}>
                      <ChevronLeft className="mr-1 h-4 w-4" /> Choose Another Date
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {slotsForSelectedDate.map(({ time, booked }) => {
                        const isSelected = selectedSlot === time;
                        const endTime = addMinutesToTime(time, 30);
                        return (
                          <button
                            key={time}
                            disabled={booked}
                            onClick={() => setSelectedSlot(time)}
                            className={cn(
                              "p-3 rounded-lg border text-left transition-all",
                              isSelected ? "bg-primary text-primary-foreground border-primary" :
                              booked ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-60" :
                              "bg-background text-foreground border-primary/30 hover:border-primary hover:bg-primary/5 cursor-pointer"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">{formatTime12(time)}</span>
                              {isSelected && <Check className="h-4 w-4" />}
                            </div>
                            <span className={cn("text-xs", isSelected ? "text-primary-foreground/80" : booked ? "text-muted-foreground" : "text-muted-foreground")}>
                              {booked ? "Booked" : `– ${formatTime12(endTime)}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Session summary */}
                    {selectedSlot && selectedDate && (
                      <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border space-y-2 text-sm">
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {format(selectedDate, "EEEE, MMMM d, yyyy")}</div>
                        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {formatTime12(selectedSlot)} – {formatTime12(addMinutesToTime(selectedSlot, 30))} (PKT)</div>
                        <div className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /> {tutorName}</div>
                        <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> 30 minutes</div>
                        <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Free Session</div>
                        <div className="flex items-center gap-2"><Video className="h-4 w-4 text-primary" /> Jitsi Meet — no download required</div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-6">
                      <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                        <ChevronLeft className="mr-1 h-4 w-4" /> Back
                      </Button>
                      <Button className="flex-1" disabled={!selectedSlot} onClick={() => setStep(3)}>
                        Confirm Booking <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : step === 3 ? (
              /* STEP 3 — CONFIRM */
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Confirm Your Session</h3>

                <div className="p-5 rounded-xl border border-border bg-muted/30 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 border-2 border-background shadow">
                      <AvatarImage src={tutor.avatar_url || undefined} />
                      <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-foreground">{tutorName}</p>
                      <p className="text-xs text-muted-foreground">{tutor.education_level} · {tutor.university}</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}</div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {selectedSlot && `${formatTime12(selectedSlot)} – ${formatTime12(addMinutesToTime(selectedSlot, 30))} (PKT)`}</div>
                    <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> 30 minutes</div>
                    <div className="flex items-center gap-2"><Video className="h-4 w-4 text-primary" /> Video via Jitsi Meet</div>
                    <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Free Demo Session</div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  After confirming, you'll receive a confirmation email with your session link. The Join button activates 15 minutes before your session starts.
                </p>

                <Button className="w-full mt-6 h-[52px] text-base font-bold" disabled={booking} onClick={handleConfirmBooking}>
                  {booking ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Booking your session...</>
                  ) : (
                    <><Check className="mr-2 h-5 w-5" /> Confirm & Book Session</>
                  )}
                </Button>

                <Button variant="ghost" className="w-full mt-2" disabled={booking} onClick={() => setStep(2)}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back to Time Selection
                </Button>
              </div>
            ) : step === "success" ? (
              /* SUCCESS SCREEN */
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-[22px] font-bold text-foreground">Session Booked!</h3>
                <p className="text-[15px] text-muted-foreground mt-2">
                  Your demo session with {tutorName} is confirmed.
                </p>

                <div className="my-6 py-3 border-y border-border space-y-1 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {selectedSlot && `${formatTime12(selectedSlot)} – ${formatTime12(addMinutesToTime(selectedSlot, 30))} (PKT)`}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-6">
                  A confirmation email has been sent to your email address.
                </p>

                <div className="space-y-2">
                  <Button className="w-full" onClick={() => { onOpenChange(false); navigate("/dashboard/student/bookings"); }}>
                    <Calendar className="mr-2 h-4 w-4" /> View My Sessions
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleMessageTutor}>
                    <MessageCircle className="mr-2 h-4 w-4" /> Message Tutor
                  </Button>
                  <button className="text-sm text-muted-foreground hover:text-foreground mt-2" onClick={() => onOpenChange(false)}>
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
