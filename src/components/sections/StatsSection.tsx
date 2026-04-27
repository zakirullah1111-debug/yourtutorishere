import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Users, GraduationCap, Trophy, Clock, Star, Shield } from "lucide-react";

const stats = [
  { icon: Users,         value: 5000,  suffix: "+", label: "Active Students",   color: "from-violet-500 to-primary" },
  { icon: GraduationCap, value: 500,   suffix: "+", label: "Expert Tutors",     color: "from-blue-500 to-cyan-500" },
  { icon: Trophy,        value: 98,    suffix: "%", label: "Success Rate",      color: "from-emerald-500 to-teal-500" },
  { icon: Clock,         value: 50000, suffix: "+", label: "Hours Taught",      color: "from-amber-500 to-orange-500" },
];

const trustBadges = [
  { icon: Shield,        text: "All tutors background-verified" },
  { icon: Star,          text: "4.9 average rating" },
  { icon: GraduationCap, text: "O-Level · A-Level · Matric · Inter" },
];

function useCounter(target: number, duration = 1800, started: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);
  return count;
}

function StatCard({ stat, delay, started }: { stat: typeof stats[0]; delay: number; started: boolean }) {
  const count = useCounter(stat.value, 1800, started);
  const fmt   = count >= 1000 ? (count / 1000).toFixed(count >= 10000 ? 0 : 1) + "K" : String(count);
  const display = count >= 1000 ? fmt + stat.suffix : count + stat.suffix;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={started ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="group flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/8"
    >
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}>
        <stat.icon className="w-7 h-7 text-white" />
      </div>
      <div className="text-3xl md:text-4xl font-bold text-foreground tabular-nums">{display}</div>
      <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
    </motion.div>
  );
}

export function StatsSection() {
  const ref     = useRef<HTMLDivElement>(null);
  const inView  = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 bg-muted/20">
      <div className="container mx-auto container-padding">

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} delay={i * 0.1} started={inView} />
          ))}
        </div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-10"
        >
          {trustBadges.map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <badge.icon className="w-4 h-4 text-primary shrink-0" />
              {badge.text}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
