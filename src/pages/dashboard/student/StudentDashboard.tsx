import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar, Clock, TrendingUp, Users, Video, ArrowRight,
  MessageSquare, Star, BookOpen, Zap, Bell, ChevronRight,
  CheckCircle2, Sparkles, Search, BadgeCheck, Timer,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSessionCompletion } from "@/hooks/useSessionCompletion";
import { cn } from "@/lib/utils";
import { format, parseISO, isAfter, addMinutes, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";

/* ─── types ──────────────────────────────────────────── */
interface Stats {
  upcoming: number;
  hoursCompleted: number;
  gradeAverage: number;
  activeTutors: number;
}

interface UpcomingSession {
  id: string;
  tutor_name: string;
  tutor_avatar: string | null;
  tutor_initials: string;
  subject: string;
  scheduled_date: string;
  scheduled_time: string;
  end_time: string;
  meeting_url: string;
}

interface FeaturedTutor {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  primary_subject: string;
  university: string;
  average_rating: number;
  total_reviews: number;
  hourly_rate_pkr: number;
  verified: boolean;
}

interface Activity {
  id: string;
  type: "session" | "message" | "payment" | "review";
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
  const dt = parseISO(`${date}T${time}`);
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
function StatCard({ icon: Icon, label, value, sub, color, href, delay }: {
  icon: any; label: string; value: string | number; sub?: string;
  color: string; href?: string; delay: number;
}) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/8 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {href && <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-primary mt-1">{sub}</div>}
    </motion.div>
  );
  return href ? <Link to={href}>{content}</Link> : content;
}

/* ─── main ────────────────────────────────────────────── */
export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useSessionCompletion();

  const [userName,    setUserName]    = useState("");
  const [isNew,       setIsNew]       = useState(false);
  const [stats,       setStats]       = useState<Stats>({ upcoming: 0, hoursCompleted: 0, gradeAverage: 0, activeTutors: 0 });
  const [sessions,    setSessions]    = useState<UpcomingSession[]>([]);
  const [tutors,      setTutors]      = useState<FeaturedTutor[]>([]);
  const [activity,    setActivity]    = useState<Activity[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [now,         setNow]         = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    try {
      /* profile */
      const { data: prof } = await supabase.from("profiles").select("first_name").eq("user_id", user!.id).single();
      if (prof) setUserName(prof.first_name);

      /* student record */
      const { data: stu } = await supabase.from("students").select("*").eq("user_id", user!.id).maybeSingle();
      if (!stu || !stu.total_sessions_completed) setIsNew(true);

      const studentId = stu?.id;

      /* upcoming sessions (demo_bookings) */
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: demos } = await supabase
        .from("demo_bookings")
        .select("id,scheduled_date,scheduled_time,end_time,tutor_id,meeting_url")
        .eq("student_id", user!.id)
        .eq("status", "confirmed")
        .gte("scheduled_date", today)
        .order("scheduled_date", { ascending: true })
        .limit(3);

      if (demos?.length) {
        const uids = [...new Set(demos.map(d => d.tutor_id))];
        const { data: profs } = await supabase.from("profiles").select("user_id,first_name,last_name,avatar_url").in("user_id", uids);
        const pm = new Map((profs || []).map(p => [p.user_id, p]));
        const mapped: UpcomingSession[] = demos.map(d => {
          const p = pm.get(d.tutor_id);
          const fn = p?.first_name || ""; const ln = p?.last_name || "";
          return {
            id: d.id, tutor_name: `${fn} ${ln}`.trim() || "Tutor",
            tutor_avatar: p?.avatar_url || null,
            tutor_initials: `${fn[0]||""}${ln[0]||""}`.toUpperCase(),
            subject: "Demo Session",
            scheduled_date: d.scheduled_date, scheduled_time: d.scheduled_time,
            end_time: d.end_time || d.scheduled_time,
            meeting_url: d.meeting_url || "",
          };
        });
        setSessions(mapped);
        setStats(prev => ({ ...prev, upcoming: demos.length }));
      }

      /* stats from student record */
      if (stu) {
        setStats(prev => ({
          ...prev,
          hoursCompleted: stu.total_hours_completed || 0,
          gradeAverage:   stu.current_grade_average  || 0,
          activeTutors:   stu.assigned_tutor_id ? 1  : 0,
        }));
      }

      /* featured tutors */
      const { data: td } = await supabase.from("tutors")
        .select("id,user_id,primary_subject,university,average_rating,total_reviews,hourly_rate_pkr,verified")
        .eq("status","Active").eq("verified",true).eq("profile_complete",true)
        .order("average_rating",{ascending:false}).limit(6);

      if (td?.length) {
        const uids2 = td.map(t => t.user_id);
        const { data: profs2 } = await supabase.from("profiles").select("user_id,first_name,last_name,avatar_url").in("user_id",uids2);
        const pm2 = new Map((profs2||[]).map(p=>[p.user_id,p]));
        setTutors(td.map(t => {
          const p = pm2.get(t.user_id);
          return { id:t.id, first_name:p?.first_name||"", last_name:p?.last_name||"",
            avatar_url:p?.avatar_url||null, primary_subject:t.primary_subject,
            university:t.university, average_rating:Number(t.average_rating)||0,
            total_reviews:t.total_reviews||0, hourly_rate_pkr:t.hourly_rate_pkr, verified:t.verified||false };
        }));
      }

      /* recent activity */
      if (studentId) {
        const acts: Activity[] = [];
        const { data: rs } = await supabase.from("sessions").select("id,subject,completed_at")
          .eq("student_id",studentId).eq("status","Completed")
          .order("completed_at",{ascending:false}).limit(3);
        rs?.forEach(s => acts.push({ id:`s-${s.id}`, type:"session", title:"Session completed",
          description:`${s.subject} session`, time:s.completed_at?timeAgo(new Date(s.completed_at)):"Recently",
          color:"bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600" }));

        const { data: rp } = await supabase.from("payments").select("id,amount_pkr,created_at,payment_status")
          .eq("student_id",studentId).order("created_at",{ascending:false}).limit(2);
        rp?.forEach(p => acts.push({ id:`p-${p.id}`, type:"payment",
          title: p.payment_status==="Completed"?"Payment processed":"Payment pending",
          description:`PKR ${p.amount_pkr?.toLocaleString()}`, time:timeAgo(new Date(p.created_at)),
          color:"bg-blue-100 dark:bg-blue-950/40 text-blue-600" }));

        setActivity(acts.slice(0,5));
      }
    } catch (e) { console.error(e); }
    finally      { setLoading(false); }
  };

  const isJoinable = (s: UpcomingSession) => {
    const start = parseISO(`${s.scheduled_date}T${s.scheduled_time}`);
    const end   = parseISO(`${s.scheduled_date}T${s.end_time}`);
    return isAfter(now, addMinutes(start,-15)) && !isAfter(now, addMinutes(end,30));
  };

  const nextSession = sessions[0];

  return (
    <DashboardLayout userType="student">
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* ── Welcome Banner ────────────────────────────── */}
        {isNew ? (
          <motion.div
            initial={{ opacity:0, y:-16 }}
            animate={{ opacity:1, y:0 }}
            className="relative overflow-hidden rounded-2xl gradient-bg p-6 md:p-8 text-white"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium text-white/80">Welcome to Studypulse!</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Hey{userName ? `, ${userName}` : ""}! 👋
              </h1>
              <p className="text-white/80 mb-6 max-w-lg text-sm md:text-base">
                You're all set. Start by finding your perfect tutor — your first 3 demo sessions are completely free.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="bg-white text-primary hover:bg-white/92 font-bold" asChild>
                  <Link to="/dashboard/student/find-tutors">
                    <Search className="w-4 h-4 mr-2" /> Find a Tutor
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/40 text-white bg-white/10 hover:bg-white/20" asChild>
                  <Link to="/tutors"><BookOpen className="w-4 h-4 mr-2" /> Browse All</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {userName ? `Welcome back, ${userName} 👋` : "Welcome back 👋"}
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">Here's what's happening with your learning.</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/student/find-tutors">
                <Search className="w-4 h-4 mr-2" /> Find Tutors
              </Link>
            </Button>
          </motion.div>
        )}

        {/* ── Stat Cards ────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {loading ? (
            [...Array(4)].map((_,i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          ) : (
            <>
              <StatCard icon={Calendar} label="Upcoming Sessions" value={stats.upcoming}
                sub={stats.upcoming > 0 ? "View schedule →" : undefined}
                color="bg-blue-500" href="/dashboard/student/bookings" delay={0} />
              <StatCard icon={Clock} label="Hours Completed" value={`${stats.hoursCompleted}h`}
                color="bg-emerald-500" href="/dashboard/student/sessions" delay={0.08} />
              <StatCard icon={TrendingUp} label="Grade Average"
                value={stats.gradeAverage > 0 ? `${stats.gradeAverage}%` : "—"}
                sub={stats.gradeAverage > 0 ? "View progress →" : "No data yet"}
                color="bg-violet-500" href="/dashboard/student/progress" delay={0.16} />
              <StatCard icon={Users} label="Active Tutors" value={stats.activeTutors}
                color="bg-amber-500" href="/dashboard/student/my-tutors" delay={0.24} />
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
              <p className="font-bold text-foreground">
                {nextSession.subject} with {nextSession.tutor_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(nextSession.scheduled_date),"EEE, MMM d")} · {fmt12(nextSession.scheduled_time)} PKT ·{" "}
                <span className="text-primary font-semibold">{getCountdown(nextSession.scheduled_date, nextSession.scheduled_time)}</span>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {isJoinable(nextSession) ? (
                <Button className="gradient-bg text-white border-0 shadow-md" onClick={() => window.open(nextSession.meeting_url,"_blank","noopener")}>
                  <Video className="w-4 h-4 mr-2" /> Join Now
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  <Timer className="w-4 h-4 mr-2" /> Join Later
                </Button>
              )}
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard/student/bookings"><ChevronRight className="w-4 h-4" /></Link>
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Main Content Grid ─────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Left col (2/3): Upcoming + Featured tutors */}
          <div className="lg:col-span-2 space-y-5">

            {/* Upcoming Sessions */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-foreground">Upcoming Sessions</h2>
                </div>
                <Link to="/dashboard/student/bookings" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {loading ? (
                <div className="p-5 space-y-3">
                  {[1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                  <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground mb-1">No upcoming sessions</p>
                  <p className="text-sm text-muted-foreground mb-4">Find a tutor and book your first free demo.</p>
                  <Button size="sm" className="gradient-bg text-white border-0" asChild>
                    <Link to="/dashboard/student/find-tutors">Find a Tutor →</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sessions.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={s.tutor_avatar || undefined} />
                        <AvatarFallback className={`${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white text-sm font-bold`}>
                          {s.tutor_initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{s.tutor_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(s.scheduled_date),"EEE, MMM d")} · {fmt12(s.scheduled_time)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={isJoinable(s) ? "default" : "secondary"} className={cn("text-[10px]", isJoinable(s) && "gradient-bg text-white border-0")}>
                          {getCountdown(s.scheduled_date, s.scheduled_time)}
                        </Badge>
                        {isJoinable(s) ? (
                          <Button size="sm" className="h-8 gradient-bg text-white border-0 text-xs" onClick={() => window.open(s.meeting_url,"_blank","noopener")}>
                            <Video className="w-3 h-3 mr-1" /> Join
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-8 text-xs" disabled>Join</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Featured Tutors */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <h2 className="font-bold text-foreground">Top Rated Tutors</h2>
                </div>
                <Link to="/dashboard/student/find-tutors" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Browse all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {loading ? (
                <div className="p-5 grid grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
              ) : tutors.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No tutors available yet.</p>
                </div>
              ) : (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tutors.slice(0,4).map((t, i) => (
                    <Link
                      key={t.id}
                      to={`/dashboard/student/tutor/${t.id}`}
                      className="group flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
                    >
                      <Avatar className="h-11 w-11 shrink-0">
                        <AvatarImage src={t.avatar_url || undefined} />
                        <AvatarFallback className={`${AVATAR_COLORS[i%AVATAR_COLORS.length]} text-white font-bold text-sm`}>
                          {t.first_name[0]}{t.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-sm text-foreground truncate">{t.first_name} {t.last_name}</p>
                          {t.verified && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{t.primary_subject}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-semibold text-foreground">{t.average_rating.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({t.total_reviews})</span>
                          </div>
                          <span className="text-xs font-semibold text-primary">PKR {t.hourly_rate_pkr.toLocaleString()}/h</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right col (1/3): Quick actions + Activity */}
          <div className="space-y-5">

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { icon: Search,       label: "Find a Tutor",    sub: "Browse 500+ tutors",        href: "/dashboard/student/find-tutors", color: "bg-primary/10 text-primary" },
                  { icon: MessageSquare,label: "Messages",         sub: "Chat with your tutors",     href: "/dashboard/student/messages",   color: "bg-blue-500/10 text-blue-500" },
                  { icon: TrendingUp,   label: "My Progress",     sub: "Track your improvements",   href: "/dashboard/student/progress",   color: "bg-violet-500/10 text-violet-500" },
                  { icon: CheckCircle2, label: "My Bookings",     sub: "View all sessions",         href: "/dashboard/student/bookings",   color: "bg-emerald-500/10 text-emerald-500" },
                ].map(a => (
                  <Link
                    key={a.href}
                    to={a.href}
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
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
                </div>
              ) : activity.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Complete a session to see your history.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activity.map(a => (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center shrink-0`}>
                        {a.type === "session"  ? <Video className="w-3.5 h-3.5" />   :
                         a.type === "payment"  ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                         a.type === "message"  ? <MessageSquare className="w-3.5 h-3.5" /> :
                         <Star className="w-3.5 h-3.5" />}
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
