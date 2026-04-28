import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Download, Clock, CheckCircle2, AlertCircle,
  Loader2, Wallet, ArrowUpRight, Receipt, Banknote, RefreshCw,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

/* ─── types ──────────────────────────────────────────── */
interface Payment {
  id: string;
  amount_pkr: number;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  tutor_name: string;
  tutor_avatar: string | null;
  tutor_initials: string;
  session_count: number | null;
  description: string | null;
}

interface Summary {
  totalPaid: number;
  totalPending: number;
  totalTransactions: number;
}

/* ─── helpers ─────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; icon: any; classes: string }> = {
  Completed: { label: "Paid",    icon: CheckCircle2,  classes: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" },
  completed: { label: "Paid",    icon: CheckCircle2,  classes: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" },
  Pending:   { label: "Pending", icon: Clock,         classes: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" },
  pending:   { label: "Pending", icon: Clock,         classes: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" },
  Failed:    { label: "Failed",  icon: AlertCircle,   classes: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400" },
  failed:    { label: "Failed",  icon: AlertCircle,   classes: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400" },
};

const METHOD_ICONS: Record<string, string> = {
  jazzcash: "📱", easypaisa: "💚", card: "💳", bank: "🏦", cash: "💵",
};

type TabKey = "all" | "completed" | "pending";

export default function Payments() {
  const { user }  = useAuth();
  const { toast } = useToast();

  const [payments,  setPayments]  = useState<Payment[]>([]);
  const [summary,   setSummary]   = useState<Summary>({ totalPaid: 0, totalPending: 0, totalTransactions: 0 });
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<TabKey>("all");

  const fetchPayments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      /* get student record */
      const { data: stu } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
      if (!stu) { setPayments([]); setLoading(false); return; }

      /* fetch payments */
      const { data: raw, error } = await supabase
        .from("payments")
        .select("id,amount_pkr,payment_status,payment_method,created_at,tutor_id,session_count,description")
        .eq("student_id", stu.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!raw?.length) { setPayments([]); setLoading(false); return; }

      /* get tutor profiles */
      const tutorIds = [...new Set(raw.map(p => p.tutor_id).filter(Boolean))];
      let profileMap = new Map<string, { name: string; avatar: string | null; initials: string }>();

      if (tutorIds.length) {
        const { data: tutors } = await supabase.from("tutors").select("id,user_id").in("id", tutorIds);
        const userIds = (tutors || []).map(t => t.user_id);
        const { data: profs } = await supabase.from("profiles").select("user_id,first_name,last_name,avatar_url").in("user_id", userIds);
        const userToTutorId = new Map((tutors || []).map(t => [t.user_id, t.id]));
        (profs || []).forEach(p => {
          const tid = userToTutorId.get(p.user_id);
          if (tid) {
            const fn = p.first_name || ""; const ln = p.last_name || "";
            profileMap.set(tid, { name: `${fn} ${ln}`.trim() || "Tutor", avatar: p.avatar_url || null, initials: `${fn[0]||""}${ln[0]||""}`.toUpperCase() });
          }
        });
      }

      const mapped: Payment[] = raw.map(p => {
        const prof = profileMap.get(p.tutor_id) || { name: "Tutor", avatar: null, initials: "T" };
        return {
          id: p.id, amount_pkr: p.amount_pkr || 0,
          payment_status: p.payment_status || "pending",
          payment_method: p.payment_method || null,
          created_at: p.created_at,
          tutor_name: prof.name, tutor_avatar: prof.avatar, tutor_initials: prof.initials,
          session_count: p.session_count || null, description: p.description || null,
        };
      });

      setPayments(mapped);

      /* summary */
      const paid    = mapped.filter(p => ["Completed","completed"].includes(p.payment_status)).reduce((s,p)=>s+p.amount_pkr,0);
      const pending = mapped.filter(p => ["Pending","pending"].includes(p.payment_status)).reduce((s,p)=>s+p.amount_pkr,0);
      setSummary({ totalPaid: paid, totalPending: pending, totalTransactions: mapped.length });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to load payments", variant: "destructive" });
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const filtered = payments.filter(p => {
    if (tab === "all") return true;
    if (tab === "completed") return ["Completed","completed"].includes(p.payment_status);
    if (tab === "pending")   return ["Pending","pending"].includes(p.payment_status);
    return true;
  });

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all",       label: "All",       count: payments.length },
    { key: "completed", label: "Paid",      count: payments.filter(p=>["Completed","completed"].includes(p.payment_status)).length },
    { key: "pending",   label: "Pending",   count: payments.filter(p=>["Pending","pending"].includes(p.payment_status)).length },
  ];

  return (
    <DashboardLayout userType="student">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payments</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your billing history and payment status</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPayments} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <motion.div
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              { icon: Wallet,       label: "Total Paid",     value: `PKR ${summary.totalPaid.toLocaleString()}`,    color: "bg-emerald-500", sub: "Lifetime" },
              { icon: Clock,        label: "Pending",        value: `PKR ${summary.totalPending.toLocaleString()}`, color: "bg-amber-500",   sub: "Awaiting" },
              { icon: Receipt,      label: "Transactions",   value: summary.totalTransactions,                      color: "bg-blue-500",    sub: "Total" },
            ].map((s, i) => (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
                <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-xl font-bold text-foreground">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Payment methods note */}
        <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/15 rounded-xl">
          <CreditCard className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Accepted Payment Methods</p>
            <p className="text-xs text-muted-foreground">JazzCash · EasyPaisa · Credit/Debit Card · Bank Transfer</p>
          </div>
          <div className="flex gap-1.5 text-lg">
            <span title="JazzCash">📱</span>
            <span title="EasyPaisa">💚</span>
            <span title="Card">💳</span>
            <span title="Bank">🏦</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                tab === t.key ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  tab === t.key ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Payment list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Banknote className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-foreground mb-1">No payments yet</h3>
            <p className="text-sm text-muted-foreground">
              {tab === "pending" ? "No pending payments." : "Your payment history will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p, i) => {
              const sc = STATUS_CONFIG[p.payment_status] || STATUS_CONFIG["pending"];
              const StatusIcon = sc.icon;
              const methodIcon = METHOD_ICONS[p.payment_method?.toLowerCase() || ""] || "💳";

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity:0, y:10 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay: i*0.05 }}
                  className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-primary/20 transition-colors"
                >
                  {/* Avatar */}
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarImage src={p.tutor_avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {p.tutor_initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-sm">{p.tutor_name}</p>
                      {p.session_count && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {p.session_count} session{p.session_count > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(p.created_at), "MMM d, yyyy")}
                      </span>
                      {p.payment_method && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {methodIcon} {p.payment_method}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount + status */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-foreground">PKR {p.amount_pkr.toLocaleString()}</p>
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1", sc.classes)}>
                      <StatusIcon className="w-3 h-3" />
                      {sc.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Need help */}
        {!loading && (
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Questions about billing?{" "}
              <a href="mailto:hello@studypulse.pk" className="text-primary hover:underline">
                Contact us at hello@studypulse.pk
              </a>
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
