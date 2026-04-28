import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, BookOpen, Award, Target, Clock, Star,
  CheckCircle2, Loader2, BarChart3, Zap, RefreshCw, Trophy,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { format, parseISO, subMonths } from "date-fns";

/* ─── types ──────────────────────────────────────────── */
interface SubjectStat {
  subject: string;
  sessions: number;
  hoursCompleted: number;
  averageRating: number;
  gradient: string;
}

interface SessionPoint {
  date: string;
  subject: string;
  rating: number | null;
  tutor_name: string;
}

interface OverallStats {
  totalSessions: number;
  totalHours: number;
  averageGrade: number;
  activeTutors: number;
  streak: number;
}

const SUBJECT_GRADIENTS = [
  "from-violet-500 to-primary",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-violet-500",
];

const ACHIEVEMENTS = [
  { id: "first",    title: "First Session",   desc: "Completed your first session",  icon: "🎯", threshold: (s: OverallStats) => s.totalSessions >= 1  },
  { id: "ten",      title: "10 Sessions",     desc: "Completed 10 sessions",         icon: "🚀", threshold: (s: OverallStats) => s.totalSessions >= 10 },
  { id: "hours",    title: "5 Hours",         desc: "Completed 5+ learning hours",   icon: "⏱️", threshold: (s: OverallStats) => s.totalHours >= 5     },
  { id: "twentyfive",title:"25 Sessions",     desc: "Completed 25 sessions",         icon: "🏆", threshold: (s: OverallStats) => s.totalSessions >= 25 },
  { id: "tutors",   title: "Multi-Tutor",     desc: "Learned from 2+ tutors",        icon: "👨‍🏫", threshold: (s: OverallStats) => s.activeTutors >= 2    },
  { id: "streak",   title: "On a Streak",     desc: "Learning 3 days in a row",      icon: "🔥", threshold: (s: OverallStats) => s.streak >= 3          },
];

export default function Progress() {
  const { user } = useAuth();

  const [overall,   setOverall]   = useState<OverallStats>({ totalSessions:0, totalHours:0, averageGrade:0, activeTutors:0, streak:0 });
  const [subjects,  setSubjects]  = useState<SubjectStat[]>([]);
  const [history,   setHistory]   = useState<SessionPoint[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [timeRange, setTimeRange] = useState<"1month"|"3months"|"6months"|"all">("3months");

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      /* student record */
      const { data: stu } = await supabase.from("students").select("*").eq("user_id", user.id).maybeSingle();
      if (!stu) { setLoading(false); return; }

      /* range filter */
      let fromDate: string | null = null;
      if (timeRange !== "all") {
        const months = timeRange === "1month" ? 1 : timeRange === "3months" ? 3 : 6;
        fromDate = subMonths(new Date(), months).toISOString();
      }

      /* sessions */
      let q = supabase.from("sessions")
        .select("id,subject,status,completed_at,scheduled_date,scheduled_time,tutor_id,rating")
        .eq("student_id", stu.id).eq("status","Completed");
      if (fromDate) q = q.gte("completed_at", fromDate);
      const { data: sess } = await q.order("completed_at",{ascending:false}).limit(100);

      /* demo bookings (also count as sessions) */
      let dq = supabase.from("demo_bookings")
        .select("id,scheduled_date,scheduled_time,tutor_id,status")
        .eq("student_id", user.id).eq("status","completed");
      if (fromDate) dq = dq.gte("scheduled_date", fromDate);
      const { data: demos } = await dq.order("scheduled_date",{ascending:false}).limit(50);

      const totalSessions = (sess?.length || 0) + (demos?.length || 0);
      const totalHours    = (stu.total_hours_completed || 0);
      const averageGrade  = (stu.current_grade_average || 0);

      /* subject breakdown */
      const subjMap: Record<string, { sessions: number; hours: number; ratings: number[] }> = {};
      sess?.forEach(s => {
        if (!subjMap[s.subject]) subjMap[s.subject] = { sessions:0, hours:0, ratings:[] };
        subjMap[s.subject].sessions++;
        subjMap[s.subject].hours += 1; // approx 1hr/session
        if (s.rating) subjMap[s.subject].ratings.push(s.rating);
      });

      const subjStats: SubjectStat[] = Object.entries(subjMap).map(([subject, data], i) => ({
        subject, sessions: data.sessions, hoursCompleted: data.hours,
        averageRating: data.ratings.length ? Math.round(data.ratings.reduce((a,b)=>a+b,0)/data.ratings.length*10)/10 : 0,
        gradient: SUBJECT_GRADIENTS[i % SUBJECT_GRADIENTS.length],
      })).sort((a,b) => b.sessions - a.sessions);

      setSubjects(subjStats);

      /* tutor count */
      const tutorIds = new Set([...(sess||[]).map(s=>s.tutor_id), ...(demos||[]).map(d=>d.tutor_id)].filter(Boolean));

      /* recent session history (for timeline) */
      const tutorUserIds = [...tutorIds];
      let profMap = new Map<string, string>();
      if (tutorUserIds.length) {
        const { data: tutrecs } = await supabase.from("tutors").select("id,user_id").in("id", tutorUserIds);
        const uids = (tutrecs||[]).map(t=>t.user_id);
        const { data: profs } = await supabase.from("profiles").select("user_id,first_name,last_name").in("user_id",uids);
        const utmap = new Map((tutrecs||[]).map(t=>[t.user_id,t.id]));
        (profs||[]).forEach(p => {
          const tid = utmap.get(p.user_id);
          if (tid) profMap.set(tid, `${p.first_name} ${p.last_name}`.trim());
        });
      }

      const historyPoints: SessionPoint[] = (sess||[]).slice(0,10).map(s => ({
        date: s.completed_at || s.scheduled_date, subject: s.subject,
        rating: s.rating || null, tutor_name: profMap.get(s.tutor_id) || "Tutor",
      }));

      setHistory(historyPoints);
      setOverall({ totalSessions, totalHours, averageGrade, activeTutors: tutorIds.size, streak: stu.streak || 0 });
    } catch(e) { console.error(e); }
    finally    { setLoading(false); }
  }, [user, timeRange]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const earnedAchievements  = ACHIEVEMENTS.filter(a => a.threshold(overall));
  const lockedAchievements  = ACHIEVEMENTS.filter(a => !a.threshold(overall));
  const maxSessions = Math.max(...subjects.map(s => s.sessions), 1);

  return (
    <DashboardLayout userType="student">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Progress</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track your learning journey</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Time range selector */}
            <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
              {([["1month","1M"],["3months","3M"],["6months","6M"],["all","All"]] as const).map(([key,label]) => (
                <button
                  key={key}
                  onClick={() => setTimeRange(key)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                    timeRange === key ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={fetchProgress} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: CheckCircle2, label:"Sessions",   value:overall.totalSessions, color:"bg-emerald-500" },
              { icon: Clock,        label:"Hours",       value:`${overall.totalHours}h`, color:"bg-blue-500" },
              { icon: TrendingUp,   label:"Grade Avg",  value:overall.averageGrade>0?`${overall.averageGrade}%`:"—", color:"bg-violet-500" },
              { icon: Zap,          label:"Tutors",     value:overall.activeTutors, color:"bg-amber-500" },
            ].map((s,i) => (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
                <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Grade average visual */}
        {!loading && overall.averageGrade > 0 && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Grade Average
              </h2>
              <span className="text-2xl font-bold gradient-text">{overall.averageGrade}%</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width:0 }}
                animate={{ width:`${overall.averageGrade}%` }}
                transition={{ duration:1, ease:"easeOut" }}
                className="h-full gradient-bg rounded-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>0%</span>
              <span className={cn(
                "font-semibold",
                overall.averageGrade >= 80 ? "text-emerald-500" :
                overall.averageGrade >= 60 ? "text-amber-500" : "text-red-500"
              )}>
                {overall.averageGrade >= 80 ? "Excellent 🎉" : overall.averageGrade >= 60 ? "Good 👍" : "Keep going 💪"}
              </span>
              <span>100%</span>
            </div>
          </motion.div>
        )}

        {/* Subject breakdown */}
        {!loading && subjects.length > 0 && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-5 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Subject Breakdown
            </h2>
            <div className="space-y-4">
              {subjects.map((s, i) => (
                <div key={s.subject}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{s.subject}</span>
                      <Badge variant="secondary" className="text-[10px]">{s.sessions} sessions</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.averageRating > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {s.averageRating}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{s.hoursCompleted}h</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width:0 }}
                      animate={{ width:`${(s.sessions/maxSessions)*100}%` }}
                      transition={{ duration:0.8, delay:i*0.1, ease:"easeOut" }}
                      className={`h-full bg-gradient-to-r ${s.gradient} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent session history */}
        {!loading && history.length > 0 && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Recent Sessions
            </h2>
            <div className="space-y-3">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{h.subject}</p>
                    <p className="text-xs text-muted-foreground">with {h.tutor_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{format(parseISO(h.date),"MMM d")}</p>
                    {h.rating && (
                      <div className="flex items-center gap-0.5 justify-end mt-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={cn("w-2.5 h-2.5", s <= h.rating! ? "fill-amber-400 text-amber-400" : "text-muted")} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Achievements */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-5 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Achievements
          </h2>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1,2,3,4,5,6].map(i=><Skeleton key={i} className="h-20 rounded-xl"/>)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ACHIEVEMENTS.map(a => {
                const earned = a.threshold(overall);
                return (
                  <div key={a.id} className={cn(
                    "p-4 rounded-xl border transition-all",
                    earned ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30 opacity-60"
                  )}>
                    <div className="text-2xl mb-2">{a.icon}</div>
                    <p className={cn("text-sm font-bold", earned ? "text-foreground" : "text-muted-foreground")}>{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                    {earned && <Badge className="mt-2 gradient-bg text-white border-0 text-[10px]">Earned ✓</Badge>}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Empty state */}
        {!loading && overall.totalSessions === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-2xl">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-foreground mb-2">No progress data yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete your first session and your progress will appear here.
            </p>
            <Button className="gradient-bg text-white border-0" asChild>
              <a href="/dashboard/student/find-tutors">Find a Tutor →</a>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
