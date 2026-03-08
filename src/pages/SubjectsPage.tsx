import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Users } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const MATH_LEVELS = [
  { key: "foundations", name: "Foundations", desc: "Numbers, basics & core arithmetic" },
  { key: "pre-algebra", name: "Pre-Algebra", desc: "Variables, equations & number patterns" },
  { key: "algebra", name: "Algebra", desc: "Linear, quadratic & polynomial expressions" },
  { key: "geometry-trigonometry", name: "Geometry & Trigonometry", desc: "Shapes, proofs & triangle functions" },
  { key: "pre-calculus", name: "Pre-Calculus", desc: "Functions, limits & advanced algebra" },
  { key: "calculus-beyond", name: "Calculus & Beyond", desc: "Derivatives, integrals & beyond" },
];

const subjectCategories = [
  {
    name: "Sciences",
    emoji: "🔬",
    subjects: ["Math", "Physics", "Chemistry", "Biology", "Statistics", "ICT", "Combined Sciences", "Psychology"],
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    name: "Languages",
    emoji: "💬",
    subjects: ["English", "Urdu"],
    color: "from-primary to-purple-500",
    bgColor: "bg-primary/5",
  },
  {
    name: "Business",
    emoji: "💼",
    subjects: ["Economics", "Business Studies", "Accounting & Finance"],
    color: "from-accent to-orange-500",
    bgColor: "bg-accent/10",
  },
  {
    name: "Humanities",
    emoji: "📚",
    subjects: ["History", "Islamiyat", "Pak Studies", "Sociology", "Education", "Law", "ESP/Business English", "Art", "Quran Recitation"],
    color: "from-success to-emerald-500",
    bgColor: "bg-success/5",
  },
];

const levels = ["O-Level", "A-Level", "Matric", "Intermediate", "University", "Professional"];

const SubjectsPage = () => {
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({});
  const [mathLevelCounts, setMathLevelCounts] = useState<Record<string, number>>({});
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingMathLevels, setLoadingMathLevels] = useState(true);

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
        setLoadingSubjects(false);
      }
    };

    const fetchMathLevels = async () => {
      try {
        const { data, error } = await supabase.rpc("get_math_level_tutor_counts");
        if (!error && data) {
          const counts: Record<string, number> = {};
          (data as { math_level: string; tutor_count: number }[]).forEach((row) => {
            counts[row.math_level] = Number(row.tutor_count);
          });
          setMathLevelCounts(counts);
        }
      } catch (e) {
        console.error("Error fetching math level counts:", e);
      } finally {
        setLoadingMathLevels(false);
      }
    };

    fetchCounts();
    fetchMathLevels();
  }, []);

  const getCategoryCount = (subjects: string[]) => {
    return subjects.reduce((sum, s) => sum + (subjectCounts[s] || 0), 0);
  };

  const getTotalMathLevelTutors = () => {
    return Object.values(mathLevelCounts).reduce((sum, c) => sum + c, 0);
  };

  const CountBadge = ({ count, loading }: { count: number; loading: boolean }) => {
    if (loading) return <Skeleton className="h-4 w-16 inline-block" />;
    return (
      <span className={`text-sm flex items-center gap-1 ${count === 0 ? "text-muted-foreground" : "text-muted-foreground"}`}>
        <Users className="w-3 h-3" />
        {count} tutors
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="gradient-subtle py-16">
          <div className="container mx-auto container-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-[1.75rem] sm:text-display-3 md:text-display-2 font-bold text-foreground mb-4">
                Explore All <span className="gradient-text">Subjects</span>
              </h1>
              <p className="text-body-lg text-muted-foreground mb-8">
                From O-Level to A-Level, find expert tutors for any subject you need to master.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search for a subject..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none text-foreground"
                />
              </div>

              {/* Level Filters */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {levels.map((level) => (
                  <button
                    key={level}
                    className="px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    {level}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Subject Categories */}
        <section className="py-16">
          <div className="container mx-auto container-padding">
            <div className="space-y-12">
              {/* Sciences */}
              {subjectCategories
                .filter((c) => c.name === "Sciences")
                .map((category, index) => (
                  <CategoryBlock
                    key={category.name}
                    category={category}
                    index={index}
                    subjectCounts={subjectCounts}
                    loading={loadingSubjects}
                    getCategoryCount={getCategoryCount}
                  />
                ))}

              {/* Talking in Math */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-primary/5 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-primary/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-2xl">
                      💬
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Talking in Math</h2>
                      <p className="text-muted-foreground text-sm">Learn math at your own level — not your grade</p>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    {loadingMathLevels ? (
                      <Skeleton className="h-5 w-32" />
                    ) : (
                      <p className="text-muted-foreground">{getTotalMathLevelTutors()} tutors available</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {MATH_LEVELS.map((level) => (
                    <Link
                      key={level.key}
                      to={`/tutors?math_level=${encodeURIComponent(level.key)}`}
                      className="bg-card rounded-xl p-4 border border-border hover:border-primary hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {level.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{level.desc}</p>
                          <div className="mt-2">
                            <CountBadge count={mathLevelCounts[level.key] || 0} loading={loadingMathLevels} />
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Languages, Business, Humanities */}
              {subjectCategories
                .filter((c) => c.name !== "Sciences")
                .map((category, index) => (
                  <CategoryBlock
                    key={category.name}
                    category={category}
                    index={index + 2}
                    subjectCounts={subjectCounts}
                    loading={loadingSubjects}
                    getCategoryCount={getCategoryCount}
                  />
                ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <AIChatbot />
    </div>
  );
};

function CategoryBlock({
  category,
  index,
  subjectCounts,
  loading,
  getCategoryCount,
}: {
  category: (typeof subjectCategories)[number];
  index: number;
  subjectCounts: Record<string, number>;
  loading: boolean;
  getCategoryCount: (subjects: string[]) => number;
}) {
  const categoryTotal = getCategoryCount(category.subjects);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`${category.bgColor} rounded-2xl sm:rounded-3xl p-5 sm:p-8`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-2xl`}>
            {category.emoji}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{category.name}</h2>
            {loading ? (
              <Skeleton className="h-5 w-32 mt-1" />
            ) : (
              <p className="text-muted-foreground">{categoryTotal} tutors available</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {category.subjects.map((subject) => (
          <Link
            key={subject}
            to={`/tutors?subject=${encodeURIComponent(subject)}`}
            className="bg-card rounded-xl p-4 border border-border hover:border-primary hover:shadow-md transition-all group min-h-[56px]"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {subject}
                </h3>
                <div className="mt-1">
                  {loading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <p className={`text-sm flex items-center gap-1 ${(subjectCounts[subject] || 0) === 0 ? "text-muted-foreground" : "text-muted-foreground"}`}>
                      <Users className="w-3 h-3" />
                      {subjectCounts[subject] || 0} tutors
                    </p>
                  )}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

export default SubjectsPage;
