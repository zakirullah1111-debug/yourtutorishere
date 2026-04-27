import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Ayesha Khan",
    level: "O-Level Student · Karachi",
    initials: "AK",
    color: "bg-violet-500",
    rating: 5,
    subject: "Physics",
    improvement: "C → A*",
    review: "I went from C to A* in Physics in just 3 months. My tutor explains things in a way no school teacher ever did. The AI chatbot at midnight before exams? Game changer.",
  },
  {
    name: "Muhammad Ali",
    level: "A-Level Student · Lahore",
    initials: "MA",
    color: "bg-primary",
    rating: 5,
    subject: "Chemistry",
    improvement: "65% → 91%",
    review: "No more hunting for Zoom links or WhatsApp groups. Everything's right in the dashboard. My Chemistry tutor is brilliant and the session recordings help me revise before papers.",
  },
  {
    name: "Fatima Ahmed",
    level: "Matric Student · Islamabad",
    initials: "FA",
    color: "bg-pink-500",
    rating: 5,
    subject: "Math",
    improvement: "60% → 92%",
    review: "My parents were worried about costs. The pricing is the most affordable I've found anywhere, and the quality is higher than expensive coaching centres. My Math went from 60 to 92.",
  },
  {
    name: "Hassan Raza",
    level: "Intermediate · Rawalpindi",
    initials: "HR",
    color: "bg-emerald-500",
    rating: 5,
    subject: "English",
    improvement: "Fail → A",
    review: "I used to fail English. Now I'm confident speaking and writing. The free demo sessions let me try 3 tutors before choosing — that alone is worth so much.",
  },
  {
    name: "Zainab Malik",
    level: "O-Level Student · Karachi",
    initials: "ZM",
    color: "bg-amber-500",
    rating: 5,
    subject: "Biology",
    improvement: "B → A*",
    review: "The progress tracking showed me exactly which topics I was weak in. My tutor built a custom plan around those gaps. Straight A's in mock exams. Parents are thrilled.",
  },
  {
    name: "Ahmed Hussain",
    level: "A-Level Student · Lahore",
    initials: "AH",
    color: "bg-blue-500",
    rating: 5,
    subject: "Economics",
    improvement: "D → B",
    review: "Economics seemed impossible until Studypulse. 24/7 AI support, a tutor who actually cares, and real practice questions. Best investment my family made this year.",
  },
  {
    name: "Sana Tariq",
    level: "Parent of O-Level student · Lahore",
    initials: "ST",
    color: "bg-rose-500",
    rating: 5,
    subject: "Multiple",
    improvement: "Parent",
    review: "As a parent I can see all session history and progress reports. I know exactly what my child is learning. The tutor is patient, professional, and my daughter actually enjoys studying now.",
  },
  {
    name: "Bilal Chaudhry",
    level: "A-Level Student · Islamabad",
    initials: "BC",
    color: "bg-teal-500",
    rating: 5,
    subject: "Math",
    improvement: "C → A",
    review: "Booked a free demo, fell in love with my tutor in the first 30 minutes. He explains Further Math like it's easy. Three months later I genuinely enjoy the subject.",
  },
];

function TestimonialCard({ t, delay, inView }: { t: typeof testimonials[0]; delay: number; inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="group bg-card border border-border rounded-2xl p-6 relative hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/8"
    >
      <Quote className="absolute top-5 right-5 w-7 h-7 text-primary/8" />

      {/* Rating */}
      <div className="flex items-center gap-1 mb-4">
        {[...Array(t.rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>

      {/* Improvement badge */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {t.subject} · {t.improvement}
      </div>

      {/* Review */}
      <p className="text-foreground text-sm leading-relaxed mb-5">"{t.review}"</p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
          {t.initials}
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.level}</p>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full font-medium">
            Verified
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function TestimonialsSection() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  // Split into two columns for masonry effect
  const col1 = testimonials.filter((_, i) => i % 2 === 0);
  const col2 = testimonials.filter((_, i) => i % 2 !== 0);

  return (
    <section className="section-padding bg-muted/20" ref={ref}>
      <div className="container mx-auto container-padding">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Student Stories</span>
          <h2 className="font-bold text-foreground mt-2 mb-4">
            Real results from{" "}
            <span className="gradient-text">real students</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            5,000+ students have transformed their grades. Here's what they say.
          </p>
        </motion.div>

        {/* Masonry (desktop) / Single col (mobile) */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} t={t} delay={i * 0.06} inView={inView} />
          ))}
        </div>

        {/* Mobile single column */}
        <div className="md:hidden space-y-4">
          {testimonials.slice(0, 4).map((t, i) => (
            <TestimonialCard key={t.name} t={t} delay={i * 0.08} inView={inView} />
          ))}
        </div>

        {/* Aggregate rating strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-8 text-center"
        >
          {[
            { val: "4.9/5", label: "Average rating", stars: true },
            { val: "3,200+", label: "Reviews written" },
            { val: "98%", label: "Would recommend" },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              {item.stars && (
                <div className="flex gap-0.5 mb-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
              )}
              <span className="text-2xl font-bold text-foreground">{item.val}</span>
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
