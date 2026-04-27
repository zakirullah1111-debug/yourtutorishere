import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Star, CheckCircle, ArrowRight, Sparkles, TrendingUp, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "Economics", "Accounting", "Islamiyat", "History"];
const LEVELS   = ["O-Level", "A-Level", "Matric", "Intermediate", "University"];

const TRUST_AVATARS = [
  { initials: "AK", color: "bg-violet-500" },
  { initials: "FA", color: "bg-pink-500" },
  { initials: "MR", color: "bg-amber-500" },
  { initials: "ZH", color: "bg-emerald-500" },
];

const TRENDING = ["Physics O-Level", "Math A-Level", "English Speaking", "Chemistry"];

const floatingCards = [
  {
    icon: Star,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    label: "Top rated session",
    value: "4.9 ★  Chemistry",
    side: "left",
    top: "top-[22%]",
  },
  {
    icon: Users,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-50 dark:bg-violet-950/40",
    label: "Students learning now",
    value: "1,247 online",
    side: "right",
    top: "top-[20%]",
  },
  {
    icon: TrendingUp,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    label: "Avg grade improvement",
    value: "+34% this month",
    side: "left",
    top: "top-[62%]",
  },
  {
    icon: Clock,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    label: "Next available slot",
    value: "Today, 5:00 PM",
    side: "right",
    top: "top-[60%]",
  },
];

export function HeroSection() {
  const navigate = useNavigate();
  const [query, setQuery]   = useState("");
  const [level, setLevel]   = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("subject", query);
    if (level) params.set("level", level);
    navigate(`/tutors${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden bg-background">

      {/* ── Background orbs ─────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
        <div className="absolute top-[-10%] left-[-5%] w-[55vw] max-w-[700px] h-[55vw] max-h-[700px] rounded-full bg-primary/6 blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[45vw] max-w-[600px] h-[45vw] max-h-[600px] rounded-full bg-purple-500/5 blur-[100px]" />
        <div className="absolute top-[40%] left-[40%] w-[30vw] max-w-[400px] h-[30vw] max-h-[400px] rounded-full bg-accent/4 blur-[90px]" />
        {/* subtle grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="container mx-auto container-padding relative z-10 pt-32 pb-20">
        <div className="max-w-5xl mx-auto">

          {/* ── Badge ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/20 text-primary text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Pakistan's #1 online tutoring platform
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </motion.div>

          {/* ── Headline ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-center mb-6"
          >
            <h1 className="font-bold tracking-tight text-foreground leading-[1.1] text-balance">
              Find the perfect tutor
              <br />
              <span className="gradient-text">in under 60 seconds.</span>
            </h1>
            <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Browse 500+ verified tutors for O-Level, A-Level, Matric & more.
              Book a free demo — no commitment, no credit card.
            </p>
          </motion.div>

          {/* ── Search bar ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mb-5"
          >
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-3 bg-card border border-border rounded-2xl p-2.5 shadow-xl shadow-black/8 max-w-3xl mx-auto"
            >
              {/* Subject input */}
              <div className="flex-1 flex items-center gap-3 px-3 py-1.5 bg-muted/50 rounded-xl min-h-[52px]">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Subject or tutor name…"
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base outline-none"
                  list="subject-list"
                />
                <datalist id="subject-list">
                  {SUBJECTS.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>

              {/* Level select */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-xl min-h-[52px] sm:w-44">
                <select
                  value={level}
                  onChange={e => setLevel(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground outline-none cursor-pointer appearance-none"
                >
                  <option value="">All levels</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* CTA */}
              <Button
                type="submit"
                size="lg"
                className="gradient-bg text-white border-0 shadow-md shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] transition-all rounded-xl px-8 min-h-[52px] text-base font-semibold shrink-0"
              >
                Search tutors
              </Button>
            </form>

            {/* Trending */}
            <div className="flex items-center justify-center flex-wrap gap-2 mt-3">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Trending:
              </span>
              {TRENDING.map(t => (
                <button
                  key={t}
                  onClick={() => { setQuery(t.split(" ")[0]); navigate(`/tutors?subject=${encodeURIComponent(t.split(" ")[0])}`); }}
                  className="text-xs px-3 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary border border-border/70 transition-colors text-muted-foreground"
                >
                  {t}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── Social proof bar ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.26 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-16"
          >
            {/* Avatars + count */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {TRUST_AVATARS.map(a => (
                  <div key={a.initials} className={`w-8 h-8 rounded-full ${a.color} border-2 border-background flex items-center justify-center text-white text-[10px] font-bold`}>
                    {a.initials}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">5,000+ students</div>
                <div className="text-xs text-muted-foreground">already learning</div>
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-border" />

            {/* Stars */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <span className="text-sm font-semibold text-foreground">4.9/5</span>
              <span className="text-xs text-muted-foreground">from 3,200+ reviews</span>
            </div>

            <div className="hidden sm:block w-px h-8 bg-border" />

            {/* Free demo */}
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-muted-foreground">3 free demo sessions</span>
            </div>
          </motion.div>

          {/* ── Stats row ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { value: "500+", label: "Verified tutors", color: "text-primary" },
              { value: "50K+", label: "Sessions taught", color: "text-violet-500" },
              { value: "98%", label: "Success rate",    color: "text-emerald-500" },
              { value: "PKR 500", label: "Starting price/hr", color: "text-amber-500" },
            ].map(s => (
              <div key={s.label} className="text-center p-4 rounded-2xl bg-card border border-border/60">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* ── Secondary CTA ────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.44 }}
            className="text-center mt-8"
          >
            <button
              onClick={() => navigate("/signup?role=tutor")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
            >
              Are you a tutor? Join and start earning
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* ── Floating social-proof cards (desktop only) ─── */}
      {floatingCards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, x: card.side === "left" ? -30 : 30, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 + i * 0.12, ease: "easeOut" }}
          className={cn(
            "hidden xl:flex absolute items-center gap-3 px-4 py-3 bg-card border border-border rounded-2xl shadow-lg",
            card.side === "left" ? "left-[2vw] 2xl:left-[4vw]" : "right-[2vw] 2xl:right-[4vw]",
            card.top
          )}
          style={{ width: 220 }}
        >
          <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
            <card.icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{card.label}</p>
            <p className="text-sm font-semibold text-foreground">{card.value}</p>
          </div>
        </motion.div>
      ))}
    </section>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
