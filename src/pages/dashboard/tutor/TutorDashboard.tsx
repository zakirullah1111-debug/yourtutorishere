import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, Calendar, DollarSign, Star, Clock, TrendingUp,
  Video, BookOpen, ArrowRight, ChevronRight, Bell, MessageSquare,
  BadgeCheck, Zap, CheckCircle2, Timer, Inbox, Award,
  BarChart3, Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSessionCompletion } from "@/hooks/useSessionCompletion";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  format, parseISO, isAfter, addMinutes,
  differenceInMinutes, differenceInHours, differenceInDays,
  startOfMonth,
} from "date-fns";

/* ─── types ──────────────────────────────────────────── */
interface TutorStats {
  activeStudents: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  averageRating: number;
  totalReviews: number;
  hoursThisMonth: number;
  pendingRequests: number;
  totalSessions: number;
}

interface UpcomingSession {
  id: string;
  student_name: string;
  student_avatar: string | null;
  student_initials: string;
  subject: string;
  scheduled_date: string;
  scheduled_time: string;
  end_time: string;
  meeting_url: string;
}

interface PendingRequest {
  id: string;
  student_name: string;
  student_avatar: string | null;
  student_initials: string;
  created_at: string;
  request_message: string | null;
}

interface Activity {
  id: string;
  type: "session" | "payment" | "review" | "request";
  title: string;
  description: string;
  time: string;
  color: string;
}

/* ─── helpers ─────────────────────────────────────────── */
const AVATAR_COLORS = ["bg-violet-500","bg-primary","bg-pink-500","bg-emerald-500","bg-amber-500","bg-blue-500"];

function timeAgo(date: Date) {
  const now = new Date();
  const mins  = differenceInMinutes(now, date);
  const hours = differenceInHours(now, date);
  const days  = differenceInDays(now, date);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7)   return `${days}d ago`;
  return format(date, "MMM d");
}

function fmt12(time: string) {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}

function getCountdown(date: string, time: string): string {
  const dt  = parseISO(`${date}T${time}`);
  const now = new Date();
  if (isAfter(now, dt)) return "Now";
  const mins  = differenceInMinutes(dt, now);
  const hours = differenceInHours(dt, now);
  const days  = differenceInDays(dt, now);
  if (mins < 60)  return `in ${mins}m`;
  if (hours < 24) return `in ${hours}h`;
  return `in ${days}d`;
}

/* ─── stat card ───────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color, href, delay, highlight }: {
  icon: any; label: string; value: string | number; sub?: string;
  color: string; href?: string; delay: number; highlight?: boolean;
}) {
  const inner = (
    <motion.div
      initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.4, delay }}
      className={cn(
        "group bg-card border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5",
        highlight
          ? "border-primary/40 shadow-lg shadow-primary/10 hover:shadow-primary/20"
          : "border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/8"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {href && <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-primary mt-1 font-medium">{sub}</div>}
    </motion.div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

/* ─── main ────────────────────────────────────────────── */
export default function TutorDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  useSessionCompletion();

  const [tutorName,    setTutorName]    = useState("");
  const [tutorId,      setTutorId]      = useState<string | null>(null);
  const [stats,        setStats]        = useState<TutorStats>({
    activeStudents:0, totalEarnings:0, thisMonthEarnings:0,
    averageRating:0, totalReviews:0, hoursThisMonth:0, pendingRequests:0, totalSessions:0
  });
  const [sessions,     setSessions]     = useState<UpcomingSession[]>([]);
  const [pending,      setPending]      = useState<PendingRequest[]>([]);
  const [activity,     setActivity]     = useState<Activity[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [now,          setNow]          = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    try {
      /* profile */
      const { data: prof } = await supabase.from("profiles").select("first_name").eq("user_id", user!.id).single();
      if (prof) setTutorName(prof.first_name);

      /* tutor record */
      const { data: tut } = await supabase.from("tutors")
        .select("id,active_students,total_students_taught,total_hours_taught,average_rating,total_reviews,hourly_rate_pkr")
        .eq("user_id", user!.id).maybeSingle();
      if (!tut) { setLoading(false); return; }
      setTutorId(tut.id);

      /* earnings */
      const { data: payments } = await supabase.from("payments").select("amount_pkr,created_at,payment_status")
        .eq("tutor_id", tut.id);
      const completed  = (payments||[]).filter(p => ["Completed","completed"].includes(p.payment_status));
      const totalEarnings = completed.reduce((s,p)=>s+p.amount_pkr,0);
      const startMo = startOfMonth(new Date()).toISOString();
      const thisMonthEarnings = completed.filter(p=>p.created_at>=startMo).reduce((s,p)=>s+p.amount_pkr,0);

      /* upcoming sessions */
      const today = format(new Date(),"yyyy-MM-dd");
      const { data: demos } = await supabase.from("demo_bookings")
        .select("id,scheduled_date,scheduled_time,end_time,student_id,meeting_url,created_at,request_message")
        .eq("tutor_id", user!.id).order("scheduled_date",{ascending:true});

      const upcomingDemos = (demos||[]).filter(d=>d.status==="confirmed" && d.scheduled_date>=today);
      const pendingDemos  = (demos||[]).filter(d=>d.status==="pending");

      /* student profiles for sessions */
      const allStudentIds = [...new Set([...upcomingDemos, ...pendingDemos].map(d=>d.student_id))];
      let studentProfMap = new Map<string, { name:string; avatar:string|null; initials:string }>();
      if (allStudentIds.length) {
        const { data: profs } = await supabase.from("profiles")
          .select("user_id,first_name,last_name,avatar_url").in("user_id", allStudentIds);
        (profs||[]).forEach(p => {
          const fn=p.first_name||""; const ln=p.last_name||"";
          studentProfMap.set(p.user_id, {
            name:`${fn} ${ln}`.trim()||"Student",
            avatar: p.avatar_url||null,
            initials:`${fn[0]||""}${ln[0]||""}`.toUpperCase()
          });
        });
      }

      const mappedSessions: UpcomingSession[] = upcomingDemos.slice(0,4).map(d => {
        const sp = studentProfMap.get(d.student_id) || { name:"Student", avatar:null, initials:"S" };
        return {
          id:d.id, student_name:sp.name, student_avatar:sp.avatar, student_initials:sp.initials,
          subject:"Demo Session", scheduled_date:d.scheduled_date,
          scheduled_time:d.scheduled_time, end_time:d.end_time||d.scheduled_time, meeting_url:d.meeting_url||"",
        };
      });

      const mappedPending: PendingRequest[] = pendingDemos.slice(0,3).map(d => {
        const sp = studentProfMap.get(d.student_id) || { name:"Student", avatar:null, initials:"S" };
        return {
          id:d.id, student_name:sp.name, student_avatar:sp.avatar, student_initials:sp.initials,
          created_at:d.created_at, request_message:d.request_message||null,
        };
      });

      /* hours this month */
      const { data: monthSess } = await supabase.from("sessions")
        .select("duration_minutes").eq("tutor_id",tut.id).eq("status","Completed").gte("completed_at",startMo);
      const hoursThisMonth = Math.round((monthSess||[]).reduce((s,x)=>s+x.duration_minutes,0)/60);

      /* total sessions */
      const { count:sessCount } = await supabase.from("sessions").select("id",{count:"exact",head:true})
        .eq("tutor_id",tut.id).eq("status","Completed");

      setSessions(mappedSessions);
      setPending(mappedPending);
      setStats({
        activeStudents:    tut.active_students||0,
        totalEarnings,
        thisMonthEarnings,
        averageRating:     Number(tut.average_rating)||0,
        totalReviews:      tut.total_reviews||0,
        hoursThisMonth:    hoursThisMonth||tut.total_hours_taught||0,
        pendingRequests:   pendingDemos.length,
        totalSessions:     sessCount||tut.total_students_taught||0,
      });

      /* activity feed */
      const acts: Activity[] = [];
      const { data: recentSess } = await supabase.from("sessions")
        .select("id,subject,completed_at").eq("tutor_id",tut.id).eq("status","Completed")
        .order("completed_at",{ascending:false}).limit(2);
      (recentSess||[]).forEach(s => acts.push({
        id:`s-${s.id}`, type:"session", title:"Session completed",
        description:`${s.subject} session`, time:s.completed_at?timeAgo(new Date(s.completed_at)):"Recently",
        color:"bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600",
      }));

      const { data: recentRev } = await supabase.from("reviews")
        .select("id,rating,created_at").eq("tutor_id",tut.id)
        .order("created_at",{ascending:false}).limit(2);
      (recentRev||[]).forEach(r => acts.push({
        id:`r-${r.id}`, type:"review",
        title:`${r.rating}-star review received`, description:"New student review",
        time:timeAgo(new Date(r.created_at)), color:"bg-amber-100 dark:bg-amber-950/40 text-amber-600",
      }));

      completed.slice(0,2).forEach(p => acts.push({
        id:`p-${Math.random()}`, type:"payment", title:"Payment received",
        description:`PKR ${p.amount_pkr?.toLocaleString()||0}`,
        time:timeAgo(new Date(p.created_at)), color:"bg-blue-100 dark:bg-blue-950/40 text-blue-600",
      }));

      setActivity(acts.slice(0,5));
    } catch(e) { console.error(e); }
    finally    { setLoading(false); }
  };

  const isJoinable = (s: UpcomingSession) => {
    const start = parseISO(`${s.scheduled_date}T${s.scheduled_time}`);
    const end   = parseISO(`${s.scheduled_date}T${s.end_time}`);
    return isAfter(now, addMinutes(start,-15)) && !isAfter(now, addMinutes(end,30));
  };

  const nextSession = sessions[0];

  return (
    <DashboardLayout userType="tutor">
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* ── Welcome ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, y:-10 }}
          animate={{ opacity:1, y:0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {tutorName ? `Welcome back, ${tutorName} 👋` : "Welcome back 👋"}
              {stats.pendingRequests > 0 && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold gradient-bg text-white px-3 py-1 rounded-full">
                  <Bell className="w-3.5 h-3.5" />
                  {stats.pendingRequests} new request{stats.pendingRequests > 1 ? "s" : ""}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {sessions.length > 0
                ? `You have ${sessions.length} upcoming session${sessions.length > 1?"s":""} scheduled.`
                : "Your teaching hub. Let's grow your students today."}
            </p>
          </div>
          <Button className="gradient-bg text-white border-0 shadow-md shadow-primary/25 shrink-0" asChild>
            <Link to="/dashboard/tutor/bookings">
              <Inbox className="w-4 h-4 mr-2" />
              View Requests
              {stats.pendingRequests > 0 && (
                <span className="ml-2 bg-white/30 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {stats.pendingRequests}
                </span>
              )}
            </Link>
          </Button>
        </motion.div>

        {/* ── Stat Cards ────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {loading ? (
            [...Array(4)].map((_,i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          ) : (
            <>
              <StatCard icon={DollarSign} label="This Month" color="bg-emerald-500" delay={0}
                value={`PKR ${stats.thisMonthEarnings.toLocaleString()}`}
                sub={stats.totalEarnings > 0 ? `PKR ${stats.totalEarnings.toLocaleString()} total` : undefined}
                href="/dashboard/tutor/earnings" highlight={stats.thisMonthEarnings > 0} />
              <StatCard icon={Users} label="Active Students" color="bg-blue-500" delay={0.08}
                value={stats.activeStudents} href="/dashboard/tutor/students"
                sub={stats.totalSessions > 0 ? `${stats.totalSessions} sessions total` : undefined} />
              <StatCard icon={Star} label="Rating" color="bg-amber-500" delay={0.16}
                value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
                sub={stats.totalReviews > 0 ? `${stats.totalReviews} reviews` : "No reviews yet"}
                href="/dashboard/tutor/reviews" />
              <StatCard icon={Clock} label="Hours This Month" color="bg-violet-500" delay={0.24}
                value={`${stats.hoursThisMonth}h`} href="/dashboard/tutor/earnings" />
            </>
          )}
        </div>

        {/* ── Next Session Countdown ────────────────────── */}
        {!loading && nextSession && (
          <motion.div
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.3 }}
            className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Next Session</p>
              <p className="font-bold text-foreground">{nextSession.subject} with {nextSession.student_name}</p>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(nextSession.scheduled_date),"EEE, MMM d")} · {fmt12(nextSession.scheduled_time)} PKT ·{" "}
                <span className="text-primary font-semibold">{getCountdown(nextSession.scheduled_date, nextSession.scheduled_time)}</span>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {isJoinable(nextSession) ? (
                <Button className="gradient-bg text-white border-0 shadow-md"
                  onClick={() => window.open(nextSession.meeting_url,"_blank","noopener")}>
                  <Video className="w-4 h-4 mr-2" /> Start Class
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  <Timer className="w-4 h-4 mr-2" /> Start Later
                </Button>
              )}
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard/tutor/bookings"><ChevronRight className="w-4 h-4" /></Link>
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Pending Requests Alert ────────────────────── */}
        {!loading && pending.length > 0 && (
          <motion.div
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.32 }}
            className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Inbox className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-foreground">
                  {pending.length} Pending Demo Request{pending.length > 1 ? "s" : ""}
                </h3>
              </div>
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-100" asChild>
                <Link to="/dashboard/tutor/bookings">
                  Review All <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
            <div className="space-y-2">
              {pending.slice(0,2).map(req => (
                <div key={req.id} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-card rounded-xl border border-amber-100 dark:border-border">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={req.student_avatar||undefined} />
                    <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 text-sm font-bold">
                      {req.student_initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{req.student_name}</p>
                    {req.request_message && (
                      <p className="text-xs text-muted-foreground truncate">"{req.request_message}"</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {timeAgo(new Date(req.created_at))}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Main Grid ────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Upcoming Sessions (2/3) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-foreground">Upcoming Sessions</h2>
                </div>
                <Link to="/dashboard/tutor/bookings" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {loading ? (
                <div className="p-5 space-y-3">
                  {[1,2].map(i=><Skeleton key={i} className="h-16 rounded-xl"/>)}
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                  <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground mb-1">No upcoming sessions</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Students will appear here once they book with you.
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/dashboard/tutor/complete-profile">
                      <BadgeCheck className="w-4 h-4 mr-2" /> Complete Profile
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sessions.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={s.student_avatar||undefined} />
                        <AvatarFallback className={`${AVATAR_COLORS[i%AVATAR_COLORS.length]} text-white text-sm font-bold`}>
                          {s.student_initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{s.student_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(s.scheduled_date),"EEE, MMM d")} · {fmt12(s.scheduled_time)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={isJoinable(s)?"default":"secondary"}
                          className={cn("text-[10px]", isJoinable(s) && "gradient-bg text-white border-0")}>
                          {getCountdown(s.scheduled_date, s.scheduled_time)}
                        </Badge>
                        {isJoinable(s) ? (
                          <Button size="sm" className="h-8 gradient-bg text-white border-0 text-xs"
                            onClick={() => window.open(s.meeting_url,"_blank","noopener")}>
                            <Video className="w-3 h-3 mr-1" /> Start
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-8 text-xs" disabled>Start</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Earnings mini-summary */}
            {!loading && stats.totalEarnings > 0 && (
              <motion.div
                initial={{ opacity:0, y:10 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay:0.4 }}
              >
                <Link to="/dashboard/tutor/earnings"
                  className="group flex items-center gap-5 bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/8 transition-all"
                >
                  <div className="w-14 h-14 gradient-bg rounded-2xl flex items-center justify-center shrink-0">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Total Earnings</p>
                    <p className="text-2xl font-bold text-foreground">
                      PKR {stats.totalEarnings.toLocaleString()}
                    </p>
                    <p className="text-xs text-primary font-medium mt-0.5">
                      PKR {stats.thisMonthEarnings.toLocaleString()} this month →
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </motion.div>
            )}
          </div>

          {/* Right col (1/3): Quick actions + Activity */}
          <div className="space-y-5">

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { icon:Inbox,        label:"Demo Requests",    sub:"Review & approve",          href:"/dashboard/tutor/bookings",          color:"bg-amber-500/10 text-amber-600" },
                  { icon:Users,        label:"My Students",      sub:"View active students",       href:"/dashboard/tutor/students",          color:"bg-blue-500/10 text-blue-500" },
                  { icon:MessageSquare,label:"Messages",         sub:"Chat with students",         href:"/dashboard/tutor/messages",          color:"bg-violet-500/10 text-violet-500" },
                  { icon:BadgeCheck,   label:"Edit Profile",     sub:"Update your public page",   href:"/dashboard/tutor/complete-profile",  color:"bg-primary/10 text-primary" },
                  { icon:TrendingUp,   label:"Earnings",         sub:"View payment history",       href:"/dashboard/tutor/earnings",          color:"bg-emerald-500/10 text-emerald-500" },
                ].map(a => (
                  <Link key={a.href} to={a.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className={`w-9 h-9 rounded-lg ${a.color} flex items-center justify-center shrink-0`}>
                      <a.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{a.label}</p>
                      <p className="text-xs text-muted-foreground">{a.sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-bold text-foreground">Recent Activity</h2>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i=><Skeleton key={i} className="h-12 rounded-lg"/>)}
                </div>
              ) : activity.length === 0 ? (
                <div className="text-center py-6">
                  <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Complete your profile to attract students.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activity.map(a => (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center shrink-0`}>
                        {a.type==="session" ? <Video className="w-3.5 h-3.5" />
                         :a.type==="review"  ? <Star className="w-3.5 h-3.5" />
                         :a.type==="request" ? <Inbox className="w-3.5 h-3.5" />
                         :<DollarSign className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
