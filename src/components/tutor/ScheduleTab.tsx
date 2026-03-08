import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X, CalendarIcon, AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let h = 8; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 22 && m > 0) break;
      const value = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      const ampm = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 || 12;
      const label = `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  active: boolean;
  slots: TimeSlot[];
}

type WeekSchedule = Record<number, DaySchedule>;

function getFilteredEndTimes(startTime: string) {
  if (!startTime) return [];
  return TIME_OPTIONS.filter((opt) => opt.value > startTime);
}

function slotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  return a.start < b.end && b.start < a.end;
}

function countSlots(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.floor(((eh * 60 + em) - (sh * 60 + sm)) / 30);
}

function getTimeLabelByValue(value: string): string {
  return TIME_OPTIONS.find((o) => o.value === value)?.label || value;
}

export function ScheduleTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    const init: WeekSchedule = {};
    DAYS.forEach((d) => {
      init[d.value] = { active: false, slots: [{ start: "09:00", end: "12:00" }] };
    });
    return init;
  });
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    if (user) fetchSchedule();
  }, [user]);

  const fetchSchedule = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: avail }, { data: tutorData }] = await Promise.all([
        supabase
          .from("tutor_availability")
          .select("*")
          .eq("tutor_id", user.id),
        supabase
          .from("tutors")
          .select("blocked_dates")
          .eq("user_id", user.id)
          .single(),
      ]);

      if (avail && avail.length > 0) {
        const newSchedule: WeekSchedule = {};
        DAYS.forEach((d) => {
          newSchedule[d.value] = { active: false, slots: [{ start: "09:00", end: "12:00" }] };
        });

        avail.forEach((row: any) => {
          const day = row.day_of_week;
          if (!newSchedule[day]) {
            newSchedule[day] = { active: true, slots: [] };
          }
          newSchedule[day].active = true;
          newSchedule[day].slots.push({
            start: row.start_time.slice(0, 5),
            end: row.end_time.slice(0, 5),
          });
        });

        // Remove default slot if DB slots were loaded
        DAYS.forEach((d) => {
          if (newSchedule[d.value].active && newSchedule[d.value].slots.length > 1) {
            // Remove the initial default if we pushed DB slots
            const slots = newSchedule[d.value].slots;
            if (slots[0].start === "09:00" && slots[0].end === "12:00" && slots.length > 1) {
              newSchedule[d.value].slots = slots.slice(1);
            }
          }
        });

        setSchedule(newSchedule);
      }

      if (tutorData?.blocked_dates) {
        const dates = (tutorData.blocked_dates as string[]).map((d: string) => new Date(d + "T00:00:00"));
        setBlockedDates(dates);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active },
    }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[day];
      return next;
    });
  };

  const updateSlot = (day: number, slotIdx: number, field: "start" | "end", value: string) => {
    setSchedule((prev) => {
      const daySchedule = { ...prev[day] };
      const slots = [...daySchedule.slots];
      slots[slotIdx] = { ...slots[slotIdx], [field]: value };
      return { ...prev, [day]: { ...daySchedule, slots } };
    });
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[day];
      return next;
    });
  };

  const addSlot = (day: number) => {
    setSchedule((prev) => {
      const daySchedule = { ...prev[day] };
      if (daySchedule.slots.length >= 2) return prev;
      return {
        ...prev,
        [day]: {
          ...daySchedule,
          slots: [...daySchedule.slots, { start: "17:00", end: "20:00" }],
        },
      };
    });
  };

  const removeSlot = (day: number, slotIdx: number) => {
    setSchedule((prev) => {
      const daySchedule = { ...prev[day] };
      const slots = daySchedule.slots.filter((_, i) => i !== slotIdx);
      return { ...prev, [day]: { ...daySchedule, slots: slots.length ? slots : [{ start: "09:00", end: "12:00" }] } };
    });
  };

  const addBlockedDate = (date: Date | undefined) => {
    if (!date) return;
    if (blockedDates.length >= 60) {
      toast({ title: "Maximum 60 blocked dates allowed", variant: "destructive" });
      return;
    }
    if (!blockedDates.some((d) => d.toDateString() === date.toDateString())) {
      setBlockedDates((prev) => [...prev, date].sort((a, b) => a.getTime() - b.getTime()));
    }
    setDatePickerOpen(false);
  };

  const removeBlockedDate = (date: Date) => {
    setBlockedDates((prev) => prev.filter((d) => d.toDateString() !== date.toDateString()));
  };

  const weekSummary = useMemo(() => {
    return DAYS.filter((d) => schedule[d.value].active).map((d) => {
      const daySchedule = schedule[d.value];
      const totalSlots = daySchedule.slots.reduce((sum, slot) => {
        if (slot.start && slot.end && slot.end > slot.start) {
          return sum + countSlots(slot.start, slot.end);
        }
        return sum;
      }, 0);
      return {
        label: d.label,
        slots: daySchedule.slots
          .filter((s) => s.start && s.end)
          .map((s) => `${getTimeLabelByValue(s.start)} – ${getTimeLabelByValue(s.end)}`),
        count: totalSlots,
      };
    });
  }, [schedule]);

  const validate = (): boolean => {
    const errors: Record<number, string> = {};
    DAYS.forEach((d) => {
      const day = schedule[d.value];
      if (!day.active) return;
      for (const slot of day.slots) {
        if (!slot.start || !slot.end) {
          errors[d.value] = "Please select both start and end times.";
          return;
        }
        if (slot.end <= slot.start) {
          errors[d.value] = "End time must be after start time.";
          return;
        }
      }
      if (day.slots.length === 2 && slotsOverlap(day.slots[0], day.slots[1])) {
        errors[d.value] = "Time slots overlap. Please adjust.";
      }
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!validate()) return;

    setSaving(true);
    try {
      // Delete existing availability
      await supabase.from("tutor_availability").delete().eq("tutor_id", user.id);

      // Build rows to insert
      const rows: any[] = [];
      DAYS.forEach((d) => {
        const day = schedule[d.value];
        if (!day.active) return;
        day.slots.forEach((slot) => {
          if (slot.start && slot.end) {
            rows.push({
              tutor_id: user.id,
              day_of_week: d.value,
              start_time: slot.start + ":00",
              end_time: slot.end + ":00",
              is_active: true,
            });
          }
        });
      });

      if (rows.length > 0) {
        const { error: insertErr } = await supabase.from("tutor_availability").insert(rows);
        if (insertErr) throw insertErr;
      }

      // Update blocked dates
      const dateStrings = blockedDates.map((d) => format(d, "yyyy-MM-dd"));
      const { error: updateErr } = await supabase
        .from("tutors")
        .update({ blocked_dates: dateStrings } as any)
        .eq("user_id", user.id);

      if (updateErr) throw updateErr;

      toast({ title: "✓ Availability saved! Students can now book sessions with you." });
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({ title: "Save failed. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Weekly Availability
          </CardTitle>
          <CardDescription>
            Set your recurring weekly schedule. Students can only book during these hours. All times are in PKT (UTC+5).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const daySchedule = schedule[day.value];
            const error = validationErrors[day.value];
            return (
              <div
                key={day.value}
                className={cn(
                  "border rounded-xl p-4 transition-all",
                  daySchedule.active ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={daySchedule.active}
                      onCheckedChange={() => toggleDay(day.value)}
                    />
                    <span className={cn("font-medium", daySchedule.active ? "text-foreground" : "text-muted-foreground")}>
                      {day.label}
                    </span>
                  </div>
                  {daySchedule.active && (
                    <span className="text-xs text-muted-foreground">
                      {daySchedule.slots.reduce((sum, s) => {
                        if (s.start && s.end && s.end > s.start) return sum + countSlots(s.start, s.end);
                        return sum;
                      }, 0)} slots
                    </span>
                  )}
                </div>

                {daySchedule.active && (
                  <div className="mt-4 space-y-3">
                    {daySchedule.slots.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-10">From</span>
                          <Select value={slot.start} onValueChange={(v) => updateSlot(day.value, idx, "start", v)}>
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_OPTIONS.map((t) => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-6">To</span>
                          <Select value={slot.end} onValueChange={(v) => updateSlot(day.value, idx, "end", v)}>
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getFilteredEndTimes(slot.start).map((t) => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {idx > 0 && (
                          <Button variant="ghost" size="icon" onClick={() => removeSlot(day.value, idx)} className="text-destructive h-8 w-8">
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    {error && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {error}
                      </p>
                    )}

                    {daySchedule.slots.length < 2 && (
                      <button
                        onClick={() => addSlot(day.value)}
                        className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add another time slot
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Live Preview */}
          <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3">Your bookable slots this week:</h4>
            {weekSummary.length > 0 ? (
              <div className="space-y-2">
                {weekSummary.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-foreground">{s.label}:</span>{" "}
                      <span className="text-muted-foreground">{s.slots.join(" & ")}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{s.count} slots</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                No availability set. Students cannot book you yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Blocked Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Block Specific Dates
          </CardTitle>
          <CardDescription>
            Override your weekly schedule for holidays or personal days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                Add blocked date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={undefined}
                onSelect={addBlockedDate}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date <= today;
                }}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {blockedDates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {blockedDates.map((date) => (
                <Badge
                  key={date.toISOString()}
                  variant="secondary"
                  className="gap-1 pr-1 text-sm"
                >
                  {format(date, "EEE, MMM d")}
                  <button
                    onClick={() => removeBlockedDate(date)}
                    className="ml-1 p-0.5 rounded-full hover:bg-destructive/20"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No dates blocked.</p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-base">
        {saving ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
        ) : (
          "Save Availability"
        )}
      </Button>
    </div>
  );
}
