import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, FlaskConical, BookOpen, Briefcase, Globe, Music, Calculator } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const subjectCategories = [
  {
    name: "Sciences",
    icon: FlaskConical,
    subjects: ["Physics", "Chemistry", "Biology", "Statistics", "ICT", "Combined Sciences", "Psychology"],
    gradient: "from-blue-500 to-cyan-500",
    lightBg: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-500",
  },
  {
    name: "Mathematics",
    icon: Calculator,
    subjects: ["Math", "Further Math", "Statistics", "Applied Math"],
    gradient: "from-violet-500 to-primary",
    lightBg: "bg-violet-50 dark:bg-violet-950/30",
    iconColor: "text-violet-500",
  },
  {
    name: "Languages",
    icon: Globe,
    subjects: ["English", "Urdu", "Arabic", "ESP / Business English"],
    gradient: "from-pink-500 to-rose-500",
    lightBg: "bg-pink-50 dark:bg-pink-950/30",
    iconColor: "text-pink-500",
  },
  {
    name: "Business",
    icon: Briefcase,
    subjects: ["Economics", "Business Studies", "Accounting & Finance", "Commerce"],
    gradient: "from-amber-500 to-orange-500",
    lightBg: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-500",
  },
  {
    name: "Humanities",
    icon: BookOpen,
    subjects: ["History", "Islamiyat", "Pak Studies", "Sociology", "Law", "Education", "Art"],
    gradient: "from-emerald-500 to-teal-500",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-500",
  },
  {
    name: "Religious",
    icon: Music,
    subjects: ["Quran Recitation", "Quran Memorization", "Islamic Studies", "Tajweed"],
    gradient: "from-teal-500 to-cyan-500",
    lightBg: "bg-teal-50 dark:bg-teal-950/30",
    iconColor: "text-teal-500",
  },
];

export function SubjectsSection() {
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { data, error } = await supabase.rpc("get_subject_tutor_counts");
        if (!error && data) {
          const counts: Record<string, number> = {};
          (data as { subject: string; tutor_count: number }[]).forEach(row => {
            counts[row.subject] = Number(row.tutor_count);
          });
          setSubjectCounts(counts);
        }
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchCounts();
  }, []);

  const getCategoryCount = (subjects: string[]) =>
    subjects.reduce((sum, s) => sum + (subjectCounts[s] || 0), 0);

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
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Subjects</span>
          <h2 className="font-bold text-foreground mt-2 mb-4">
            Whatever you're studying,{" "}
            <span className="gradient-text">we've got you</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From O-Level to A-Level, Matric to Intermediate — every major subject across every Pakistani curriculum.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjectCategories.map((cat, i) => {
            const count = getCategoryCount(cat.subjects);
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/8"
              >
                {/* Category header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl ${cat.lightBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <cat.icon className={`w-5 h-5 ${cat.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{cat.name}</h3>
                      {loading ? (
                        <Skeleton className="h-3.5 w-20 mt-1" />
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {count > 0 ? `${count} tutor${count !== 1 ? "s" : ""} available` : "Coming soon"}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/tutors?category=${cat.name.toLowerCase()}`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ArrowRight className={`w-4 h-4 ${cat.iconColor}`} />
                  </Link>
                </div>

                {/* Subject pills */}
                <div className="flex flex-wrap gap-2">
                  {cat.subjects.map(subject => (
                    <Link
                      key={subject}
                      to={`/tutors?subject=${encodeURIComponent(subject)}`}
                      className="px-3 py-1 bg-muted/70 rounded-lg text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors font-medium"
                    >
                      {subject}
                    </Link>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-10"
        >
          <Link
            to="/subjects"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline underline-offset-4"
          >
            View all subjects & curricula
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
