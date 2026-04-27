import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, Video, Wallet, BadgeCheck, BarChart3, MessageCircle, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: BadgeCheck,
    gradient: "from-violet-500 to-primary",
    tag: "Trust",
    title: "100% Verified Tutors",
    description: "Every tutor is identity-checked, degree-verified, and personally reviewed by our team before going live. You're always in safe hands.",
    size: "large",
  },
  {
    icon: Video,
    gradient: "from-blue-500 to-cyan-500",
    tag: "Sessions",
    title: "Seamless video classes",
    description: "Join Jitsi-powered video sessions directly from your dashboard — no downloads, no links, no confusion.",
    size: "normal",
  },
  {
    icon: Wallet,
    gradient: "from-amber-500 to-orange-500",
    tag: "Pricing",
    title: "Starting PKR 500/hr",
    description: "Competitive, transparent pricing. Pay per session or save with packages. JazzCash, EasyPaisa & cards accepted.",
    size: "normal",
  },
  {
    icon: Brain,
    gradient: "from-pink-500 to-rose-500",
    tag: "AI",
    title: "24/7 AI study assistant",
    description: "Stuck at midnight before an exam? Our AI chatbot answers questions, explains concepts, and helps you practice — any time.",
    size: "normal",
  },
  {
    icon: BarChart3,
    gradient: "from-emerald-500 to-teal-500",
    tag: "Progress",
    title: "Real progress tracking",
    description: "Visual charts, session history, grade improvements, and weekly reports for parents.",
    size: "normal",
  },
  {
    icon: MessageCircle,
    gradient: "from-indigo-500 to-violet-500",
    tag: "Communication",
    title: "Built-in messaging",
    description: "Chat with tutors before you book. Ask anything, share your syllabus, coordinate timings — all in one place.",
    size: "normal",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } }),
};

export function FeaturesSection() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto container-padding">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" /> Why Studypulse
          </span>
          <h2 className="font-bold text-foreground mb-4">
            Everything you need to{" "}
            <span className="gradient-text">excel</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We built what students and parents actually asked for — not what looked good on a pitch deck.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              className={`group relative bg-card border border-border rounded-2xl p-7 overflow-hidden hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/8 ${f.size === "large" ? "md:col-span-2 lg:col-span-1" : ""}`}
            >
              {/* background glow on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 rounded-2xl`} />

              {/* tag */}
              <span className={`inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r ${f.gradient} text-white mb-4`}>
                {f.tag}
              </span>

              {/* icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom shield badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-muted/50 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-emerald-500" />
            Your safety is our priority — all tutors are manually verified before joining
          </div>
        </motion.div>
      </div>
    </section>
  );
}
