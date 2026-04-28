import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DollarSign, TrendingUp, Calendar, Clock,
  ArrowUpRight, Wallet, CheckCircle2, AlertCircle, RefreshCw,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { cn } from "@/lib/utils";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";

/* ─── types ──────────────────────────────────────────── */
interface Transaction {
  id: string;
  studentName: string;
  studentAvatar: string | null;
  studentInitials: string;
  subject: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "processing";
  sessions: number;
}

const STATUS_CONFIG = {
  completed:  { label: "Paid",       classes: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" },
  pending:    { label: "Pending",    classes: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" },
  processing: { label: "Processing", classes: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400" },
};

const AVATAR_COLORS = ["bg-violet-500","bg-primary","bg-pink-500","bg-emerald-500","bg-amber-500","bg-blue-500"];

export default function Earnings() {
  const { user } = useAuth();
  const [timeRange,        setTimeRange]        = useState<"1month"|"3months"|"6months"|"1year">("6months");
  const [transactions,     setTransactions]     = useState<Transaction[]>([]);
  const [monthlyEarnings,  setMonthlyEarnings]  = useState<{ month: string; earnings: number }[]>([]);
  const [subjectEarnings,  setSubjectEarnings]  = useState<{ subject: string; earnings: number; sessions: number }[]>([]);
  const [totalEarnings,    setTotalEarnings]    = useState(0);
  const [thisMonthEarnings,setThisMonthEarnings]= useState(0);
  const [lastMonthEarnings,setLastMonthEarnings]= useState(0);
  const [pendingAmount,    setPendingAmount]    = useState(0);
  const [totalSessions,    setTotalSessions]    = useState(0);
  const [loading,          setLoading]          = useState(true);

  useEffect(() => { if (user) fetchEarnings(); }, [user, timeRange]);

  async function fetchEarnings() {
    if (!user) return;
    setLoading(true);
    try {
      const { data: tutorData } = await supabase.from("tutors")
        .select("id,hourly_rate_pkr").eq("user_id", user.id).maybeSingle();
      if (!tutorData) { setLoading(false); return; }

      /* payments */
      const months = timeRange==="1month"?1:timeRange==="3months"?3:timeRange==="6months"?6:12;
      const fromDate = subMonths(new Date(), months).toISOString();

      const { data: payments } = await supabase.from("payments").select("*")
        .eq("tutor_id", tutorData.id).gte("created_at", fromDate)
        .order("created_at",{ascending:false});

      if (payments) {
        const completed  = payments.filter(p=>["Completed","completed"].includes(p.payment_status));
        const pending    = payments.filter(p=>["Pending","pending","Processing","processing"].includes(p.payment_status));
        const startMo    = startOfMonth(new Date()).toISOString();
        const startPrevMo= startOfMonth(subMonths(new Date(),1)).toISOString();

        setTotalEarnings(completed.reduce((s,p)=>s+p.amount_pkr,0));
        setPendingAmount(pending.reduce((s,p)=>s+p.amount_pkr,0));
        setThisMonthEarnings(completed.filter(p=>p.created_at>=startMo).reduce((s,p)=>s+p.amount_pkr,0));
        setLastMonthEarnings(completed.filter(p=>p.created_at>=startPrevMo&&p.created_at<startMo).reduce((s,p)=>s+p.amount_pkr,0));

        /* student names */
        const studentIds = [...new Set(payments.map(p=>p.student_id))];
        const { data: sRecs } = await supabase.from("students").select("id,user_id,primary_subject").in("id",studentIds);
        const uids = (sRecs||[]).map(s=>s.user_id);
        const { data: profs } = await supabase.from("profiles").select("user_id,first_name,last_name,avatar_url").in("user_id",uids);
        const sMap = new Map<string,{name:string;avatar:string|null;initials:string;subject:string}>();
        (sRecs||[]).forEach(s=>{
          const p = profs?.find(x=>x.user_id===s.user_id);
          const fn=p?.first_name||""; const ln=p?.last_name||"";
          sMap.set(s.id,{name:`${fn} ${ln}`.trim()||"Student",avatar:p?.avatar_url||null,
            initials:`${fn[0]||""}${ln[0]||""}`.toUpperCase(),subject:s.primary_subject||"N/A"});
        });

        setTransactions(payments.slice(0,12).map(p=>{
          const s = sMap.get(p.student_id)||{name:"Student",avatar:null,initials:"S",subject:"N/A"};
          return {
            id:p.id, studentName:s.name, studentAvatar:s.avatar, studentInitials:s.initials,
            subject:s.subject, amount:p.amount_pkr,
            date:p.payment_date||p.created_at,
            status:((p.payment_status?.toLowerCase()||"pending") as "completed"|"pending"|"processing"),
            sessions:p.session_ids?.length||1,
          };
        }));

        /* monthly chart */
        const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const mData:Record<string,number>={};
        for(let i=months-1;i>=0;i--){const d=subMonths(new Date(),i);mData[MONTHS[d.getMonth()]]=0;}
        completed.forEach(p=>{const mn=MONTHS[new Date(p.created_at).getMonth()];if(mData[mn]!==undefined)mData[mn]+=p.amount_pkr;});
        setMonthlyEarnings(Object.entries(mData).map(([month,earnings])=>({month,earnings})));
      }

      /* sessions */
      const { data: sessions } = await supabase.from("sessions")
        .select("id,subject,duration_minutes").eq("tutor_id",tutorData.id).eq("status","Completed")
        .gte("completed_at",fromDate);
      if(sessions){
        setTotalSessions(sessions.length);
        const sbjMap:Record<string,{earnings:number;sessions:number}>={};
        sessions.forEach(s=>{
          if(!sbjMap[s.subject])sbjMap[s.subject]={earnings:0,sessions:0};
          sbjMap[s.subject].sessions++;
          sbjMap[s.subject].earnings+=Math.round((s.duration_minutes/60)*tutorData.hourly_rate_pkr);
        });
        setSubjectEarnings(Object.entries(sbjMap).map(([subject,d])=>({subject,...d})).sort((a,b)=>b.earnings-a.earnings));
      }
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  }

  const momChange = lastMonthEarnings > 0
    ? Math.round(((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100)
    : null;

  const tooltipStyle = {
    backgroundColor:"hsl(var(--card))",
    border:"1px solid hsl(var(--border))",
    borderRadius:"10px", fontSize:"12px",
  };

  return (
    <DashboardLayout userType="tutor">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track your income and payment history</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
              {([["1month","1M"],["3months","3M"],["6months","6M"],["1year","1Y"]] as const).map(([key,label])=>(
                <button key={key} onClick={()=>setTimeRange(key)}
                  className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                    timeRange===key?"bg-card text-foreground shadow-sm border border-border":"text-muted-foreground hover:text-foreground")}>
                  {label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={fetchEarnings} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4",loading&&"animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i=><Skeleton key={i} className="h-28 rounded-2xl"/>)}
          </div>
        ) : (
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon:DollarSign, label:"Total Earnings",    value:`PKR ${totalEarnings.toLocaleString()}`,     color:"bg-emerald-500",
                sub: momChange!==null ? `${momChange>=0?"+":""}${momChange}% vs last month` : undefined,
                subColor: momChange!==null ? momChange>=0?"text-emerald-600":"text-red-500" : undefined },
              { icon:Calendar,   label:"This Month",        value:`PKR ${thisMonthEarnings.toLocaleString()}`, color:"bg-blue-500" },
              { icon:Wallet,     label:"Pending",           value:`PKR ${pendingAmount.toLocaleString()}`,     color:"bg-amber-500" },
              { icon:Clock,      label:"Sessions",          value:totalSessions,                              color:"bg-violet-500",
                sub: totalSessions>0?`~PKR ${Math.round(totalEarnings/Math.max(totalSessions,1)).toLocaleString()}/session`:undefined },
            ].map(s=>(
              <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
                <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-xl font-bold text-foreground">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
                {s.sub && <div className={cn("text-xs mt-1 font-medium", s.subColor||"text-primary")}>{s.sub}</div>}
              </div>
            ))}
          </motion.div>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Monthly trend */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Earnings Trend
            </h2>
            {loading ? <Skeleton className="h-52 rounded-xl" /> : monthlyEarnings.length === 0 ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No data for this period</p>
              </div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyEarnings}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{fontSize:11}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`} />
                    <Tooltip formatter={(v:number)=>[`PKR ${v.toLocaleString()}`,"Earnings"]} contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" strokeWidth={2.5}
                      dot={{fill:"hsl(var(--primary))",r:4}} activeDot={{r:6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* By subject */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> By Subject
            </h2>
            {loading ? <Skeleton className="h-52 rounded-xl" /> : subjectEarnings.length === 0 ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No session data yet</p>
              </div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectEarnings} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`} />
                    <YAxis dataKey="subject" type="category" width={90} tick={{fontSize:11}} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v:number)=>[`PKR ${v.toLocaleString()}`,"Earnings"]} contentStyle={tooltipStyle} />
                    <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[0,6,6,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-bold text-foreground">Recent Transactions</h2>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1,2,3].map(i=><Skeleton key={i} className="h-16 rounded-xl"/>)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-5">
              <DollarSign className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Payments will appear here after sessions.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((t, i) => {
                const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.pending;
                return (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={t.studentAvatar||undefined} />
                      <AvatarFallback className={`${AVATAR_COLORS[i%AVATAR_COLORS.length]} text-white text-sm font-bold`}>
                        {t.studentInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground">{t.studentName}</p>
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {t.subject}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(t.date),"MMM d, yyyy")} · {t.sessions} session{t.sessions>1?"s":""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground">PKR {t.amount.toLocaleString()}</p>
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1",sc.classes)}>
                        {t.status==="completed" ? <CheckCircle2 className="w-2.5 h-2.5"/> : <AlertCircle className="w-2.5 h-2.5"/>}
                        {sc.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
