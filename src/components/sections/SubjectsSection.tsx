import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const subjectCategories = [
  {
    name: "Sciences",
    emoji: "🔬",
    subjects: ["Physics", "Chemistry", "Biology", "Math", "Statistics", "ICT", "Combined Sciences", "Psychology"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Languages",
    emoji: "💬",
    subjects: ["English", "Urdu"],
    color: "from-primary to-purple-500",
  },
  {
    name: "Business",
    emoji: "💼",
    subjects: ["Economics", "Business Studies", "Accounting & Finance"],
    color: "from-accent to-orange-500",
  },
  {
    name: "Humanities",
    emoji: "📚",
    subjects: ["History", "Islamiyat", "Pak Studies", "Sociology", "Education", "Law", "ESP/Business English", "Art", "Quran Recitation"],
    color: "from-success to-emerald-500",
  },
];

export function SubjectsSection() {
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { data, error } = await supabase.rpc("get_subject_tutor_counts");
        if (!error && data) {
          const counts: Record<string, number> = {};
          (data as { subject: string; tutor_count: number }[]).forEach((row) => {
            counts[row.subject] = Number(row.tutor_count);
          });
          setSubjectCounts(counts);
        }
      } catch (e) {
        console.error("Error fetching subject counts:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  const getCategoryCount = (subjects: string[]) =>
    subjects.reduce((sum, s) => sum + (subjectCounts[s] || 0), 0);

  return (
    <section className="section-padding bg-muted/30">
      <div className="container mx-auto container-padding">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Subjects</span>
          <h2 className="text-heading-1 md:text-display-3 font-bold text-foreground mt-2 mb-4">
            Learn Any Subject with{" "}
            <span className="gradient-text">Expert Tutors</span>
          </h2>
          <p className="text-muted-foreground text-body-lg max-w-2xl mx-auto">
            From O-Level to A-Level, Matric to Intermediate - we cover all major curricula in Pakistan.
          </p>
        </motion.div>

        {/* Subject Categories Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {subjectCategories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-card rounded-2xl p-6 lg:p-8 border border-border card-hover"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-2xl`}>
                    {category.emoji}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{category.name}</h3>
                    {loading ? (
                      <Skeleton className="h-4 w-20 mt-1" />
                    ) : (
                      <p className="text-sm text-muted-foreground">{getCategoryCount(category.subjects)} tutors</p>
                    )}
                  </div>
                </div>
                <Link
                  to={`/subjects?category=${category.name.toLowerCase()}`}
                  className="text-primary font-medium text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Subjects Tags */}
              <div className="flex flex-wrap gap-2">
                {category.subjects.map((subject) => (
                  <Link
                    key={subject}
                    to={`/tutors?subject=${encodeURIComponent(subject)}`}
                    className="px-3 py-1.5 bg-muted rounded-lg text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {subject}
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            to="/subjects"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            Explore All Subjects
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
