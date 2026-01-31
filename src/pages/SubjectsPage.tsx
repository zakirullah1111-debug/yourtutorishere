import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Users } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { Button } from "@/components/ui/button";

const subjectCategories = [
  {
    name: "Sciences",
    emoji: "🔬",
    subjects: [
      { name: "Math", tutors: 120 },
      { name: "Physics", tutors: 85 },
      { name: "Chemistry", tutors: 92 },
      { name: "Biology", tutors: 78 },
      { name: "Statistics", tutors: 45 },
      { name: "ICT", tutors: 67 },
      { name: "Combined Sciences", tutors: 55 },
      { name: "Psychology", tutors: 38 },
    ],
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
  },
  {
    name: "Languages",
    emoji: "💬",
    subjects: [
      { name: "English", tutors: 150 },
      { name: "Urdu", tutors: 95 },
      { name: "Arabic", tutors: 42 },
      { name: "Chinese", tutors: 28 },
      { name: "French", tutors: 35 },
      { name: "Sindhi", tutors: 25 },
      { name: "Spoken Urdu for Beginners", tutors: 40 },
    ],
    color: "from-primary to-purple-500",
    bgColor: "bg-primary/5",
  },
  {
    name: "Business",
    emoji: "💼",
    subjects: [
      { name: "Economics", tutors: 70 },
      { name: "Business Studies", tutors: 65 },
      { name: "Accounting & Finance", tutors: 80 },
    ],
    color: "from-accent to-orange-500",
    bgColor: "bg-accent/10",
  },
  {
    name: "Humanities",
    emoji: "📚",
    subjects: [
      { name: "History", tutors: 45 },
      { name: "Islamiyat", tutors: 88 },
      { name: "Pak Studies", tutors: 90 },
      { name: "Sociology", tutors: 32 },
      { name: "Education", tutors: 40 },
      { name: "Law", tutors: 25 },
      { name: "ESP/Business English", tutors: 55 },
      { name: "Art", tutors: 30 },
      { name: "Quran Recitation", tutors: 95 },
    ],
    color: "from-success to-emerald-500",
    bgColor: "bg-success/5",
  },
];

const levels = ["O-Level", "A-Level", "Matric", "Intermediate", "University", "Professional"];

const SubjectsPage = () => {
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
              <h1 className="text-display-3 md:text-display-2 font-bold text-foreground mb-4">
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
              {subjectCategories.map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`${category.bgColor} rounded-3xl p-8`}
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-2xl`}>
                        {category.emoji}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">{category.name}</h2>
                        <p className="text-muted-foreground">
                          {category.subjects.reduce((sum, s) => sum + s.tutors, 0)}+ tutors available
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subjects Grid */}
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {category.subjects.map((subject) => (
                      <Link
                        key={subject.name}
                        to={`/tutors?subject=${encodeURIComponent(subject.name)}`}
                        className="bg-card rounded-xl p-4 border border-border hover:border-primary hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {subject.name}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Users className="w-3 h-3" />
                              {subject.tutors} tutors
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
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

export default SubjectsPage;
