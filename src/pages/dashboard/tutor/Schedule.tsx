import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Clock,
  Video,
  Calendar as CalendarIcon,
  Plus,
  Settings,
} from "lucide-react";

interface Session {
  id: string;
  studentName: string;
  subject: string;
  time: string;
  duration: number;
  status: "scheduled" | "completed" | "cancelled";
}

interface DaySchedule {
  date: Date;
  sessions: Session[];
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availabilityDays, setAvailabilityDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ]);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("afternoon");
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);

  // Mock sessions data
  const todaySessions: Session[] = [
    {
      id: "1",
      studentName: "Ahmed Khan",
      subject: "Mathematics",
      time: "14:00",
      duration: 60,
      status: "scheduled",
    },
    {
      id: "2",
      studentName: "Sara Ali",
      subject: "Physics",
      time: "16:00",
      duration: 60,
      status: "scheduled",
    },
    {
      id: "3",
      studentName: "Usman Malik",
      subject: "Chemistry",
      time: "18:00",
      duration: 90,
      status: "scheduled",
    },
  ];

  const weekSchedule = [
    { day: "Monday", sessions: 3 },
    { day: "Tuesday", sessions: 2 },
    { day: "Wednesday", sessions: 4 },
    { day: "Thursday", sessions: 2 },
    { day: "Friday", sessions: 3 },
    { day: "Saturday", sessions: 1 },
    { day: "Sunday", sessions: 0 },
  ];

  const formatTime = (timeStr: string) => {
    const [hours] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:00 ${ampm}`;
  };

  const toggleAvailabilityDay = (day: string) => {
    setAvailabilityDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <DashboardLayout userType="tutor">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Schedule</h1>
            <p className="text-muted-foreground">
              Manage your teaching schedule and availability
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Set Availability
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Set Your Availability</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-3">
                    <Label>Available Days</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={day}
                            checked={availabilityDays.includes(day)}
                            onCheckedChange={() => toggleAvailabilityDay(day)}
                          />
                          <label htmlFor={day} className="text-sm">
                            {day}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Preferred Time Slot</Label>
                    <Select value={preferredTimeSlot} onValueChange={setPreferredTimeSlot}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (2 PM - 5 PM)</SelectItem>
                        <SelectItem value="evening">Evening (5 PM - 9 PM)</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full" onClick={() => setShowAvailabilityDialog(false)}>
                    Save Availability
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />

              {/* Week Overview */}
              <div className="mt-6 space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">This Week</h4>
                {weekSchedule.map((day) => (
                  <div
                    key={day.day}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span
                      className={`text-sm ${
                        availabilityDays.includes(day.day)
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {day.day}
                    </span>
                    <Badge
                      variant={day.sessions > 0 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {day.sessions} session{day.sessions !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Sessions */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Today's Sessions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedDate?.toLocaleDateString("en-PK", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Badge variant="secondary">{todaySessions.length} sessions</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {todaySessions.length > 0 ? (
                <div className="space-y-4">
                  {todaySessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-lg font-bold">{formatTime(session.time)}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.duration} min
                          </p>
                        </div>
                        <div className="h-12 w-px bg-border" />
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {session.studentName.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{session.studentName}</p>
                          <p className="text-sm text-muted-foreground">{session.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            session.status === "scheduled"
                              ? "bg-blue-500/10 text-blue-600"
                              : session.status === "completed"
                              ? "bg-green-500/10 text-green-600"
                              : "bg-red-500/10 text-red-600"
                          }
                        >
                          {session.status}
                        </Badge>
                        <Button size="sm">
                          <Video className="w-4 h-4 mr-2" />
                          Start Session
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No sessions scheduled for this day</p>
                </div>
              )}

              {/* Time Slots */}
              <div className="mt-8">
                <h4 className="font-medium mb-4">Available Time Slots</h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isBooked = todaySessions.some((s) => s.time === slot);
                    return (
                      <Button
                        key={slot}
                        variant={isBooked ? "secondary" : "outline"}
                        size="sm"
                        disabled={isBooked}
                        className="text-xs"
                      >
                        {formatTime(slot)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
