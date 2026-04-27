import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { UserPlus, Search, CalendarCheck, Video, Star, Briefcase, CheckCircle, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const studentSteps = [
  { icon: UserPlus,     color: "bg-primary",       num: "01", title: "Create your account",       desc: "Sign up in 90 seconds. Tell us your subject, level, and learning goals." },
  { icon: Search,       color: "bg-blue-500",       num: "02", title: "Discover perfect tutors",   desc: "Browse verified tutors by subject, rating, price, and availability. Read real reviews." },
  { icon: CalendarCheck,color: "bg-violet-500",     num: "03", title: "Book a free demo",          desc: "Schedule a 30-minute free session with up to 3 tutors before committing to anything." },
  { icon: Video,        color: "bg-emerald-500",    num: "04", title: "Start learning",            desc: "Join video classes directly from your dashboard. No downloads, no confusion." },
  { icon: Star,         color: "bg-amber-500",      num: "05", title: "Track & improve",           desc: "Watch your grades climb with personalized progress reports and session reviews." },
];

const tutorSteps = [
  { icon: UserPlus,     color: "bg-primary",       num: "01", title: "Apply to join",             desc: "Submit your qualifications. Our team reviews your profile within 24 hours." },
  { icon: CheckCircle,  color: "bg-emerald-500",   num: "02", title: "Get verified",              desc: "Complete identity & degree verification. Verified tutors get 3× more bookings." },
  { icon: Briefcase,    color: "bg-violet-500",    num: "03", title: "Build your profile",        desc: "Set your rate, upload a demo video, configure your availability schedule." },
  { icon: Video,        color: "bg-blue-500",      num: "04", title: "Teach & get paid",          desc: "Accept session requests and teach via integrated Jitsi video — no third-party tools." },
  { icon: DollarSign,   color: "bg-amber-500",     num: "05", title: "Grow your earnings",       desc: "Earn on your own schedule. Top tutors make PKR 80,000+ per month on Studypulse." },
];

export function HowItWorksSection() {
  const [tab, setTab]  = useState<"student" | "tutor">("student");
  const ref            = useRef<HTMLDivElement>(null);
  const inView         = useInView(ref, { once: true, margin: "-60px" });
  const steps          = tab === "student" ? studentSteps : tutorSteps;

  return (
    <section className="section-padding bg-muted/20" ref={ref}>
      <div className="container mx-auto container-padding">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">How it works</span>
          <h2 className="font-bold text-foreground mt-2 mb-4">
            Up and running in{" "}
            <span className="gradient-text">minutes</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Whether you're here to learn or to teach — getting started takes less time than making chai.
          </p>
        </motion.div>

        {/* Tab toggle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-12"
        >
          <div className="flex p-1.5 bg-muted rounded-xl gap-1">
            {(["student", "tutor"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 capitalize",
                  tab === t
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                I'm a {t}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Steps — vertical on mobile, horizontal on desktop */}
        <div className="max-w-4xl mx-auto">

          {/* Desktop: horizontal timeline */}
          <div className="hidden md:grid grid-cols-5 gap-4 relative">
            {/* connecting line */}
            <div className="absolute top-[28px] left-[10%] right-[10%] h-[2px] bg-border" />

            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: 0.2 + i * 0.1 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                {/* icon circle */}
                <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center mb-4 shadow-md relative`}>
                  <step.icon className="w-6 h-6 text-white" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-background border-2 border-border flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground mb-1.5">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Mobile: vertical list */}
          <div className="md:hidden space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                className="flex gap-4 items-start"
              >
                <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 pb-4 border-b border-border last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground">{step.num}</span>
                    <h3 className="font-bold text-foreground">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
