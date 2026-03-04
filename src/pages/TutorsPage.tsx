import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Filter, Star, Clock, MessageSquare, Heart, Sparkles, ChevronDown, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface PublicTutor {
  id: string;
  name: string;
  avatar: string;
  avatarColor: string;
  subjects: string[];
  rating: number;
  reviews: number;
  experience: string;
  education: string;
  languages: string[];
  price: number;
  verified: boolean;
}

const subjects = ["All Subjects", "Physics", "Chemistry", "Biology", "Math", "English", "Urdu", "Economics", "Business Studies", "Islamiyat"];
const levels = ["All Levels", "O-Level", "A-Level", "Matric", "Intermediate", "University"];
const priceRanges = ["Any Price", "PKR 500-800", "PKR 800-1000", "PKR 1000-1500", "PKR 1500+"];

const avatarColors = ["bg-primary", "bg-success", "bg-accent", "bg-indigo-500", "bg-emerald-500", "bg-pink-500"];

const TutorsPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [tutors, setTutors] = useState<PublicTutor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTutors() {
      try {
        const { data: tutorsData, error } = await supabase
          .from("tutors")
          .select("id, user_id, primary_subject, secondary_subject, additional_subjects, university, degree, education_level, years_of_experience, hourly_rate_pkr, average_rating, total_reviews, verified, languages")
          .or("verified.eq.true,profile_complete.eq.true");

        if (error) throw error;
        if (!tutorsData || tutorsData.length === 0) {
          setTutors([]);
          setLoading(false);
          return;
        }

        const userIds = tutorsData.map((t) => t.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", userIds);

        const mapped: PublicTutor[] = tutorsData.map((t, i) => {
          const profile = profiles?.find((p) => p.user_id === t.user_id);
          const name = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "Unknown";
          const allSubjects = [t.primary_subject, t.secondary_subject, ...(t.additional_subjects || [])].filter(Boolean) as string[];
          return {
            id: t.id,
            name,
            avatar: name[0]?.toUpperCase() || "T",
            avatarColor: avatarColors[i % avatarColors.length],
            subjects: allSubjects.slice(0, 3),
            rating: Number(t.average_rating) || 0,
            reviews: t.total_reviews || 0,
            experience: `${t.years_of_experience || 0} years`,
            education: `${t.degree}, ${t.university}`,
            languages: t.languages || ["English", "Urdu"],
            price: t.hourly_rate_pkr,
            verified: t.verified || false,
          };
        });

        setTutors(mapped);
      } catch (err) {
        console.error("Error fetching tutors:", err);
        setTutors([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTutors();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="gradient-subtle py-12">
          <div className="container mx-auto container-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-display-3 md:text-display-2 font-bold text-foreground mb-4">
                Find Your Perfect <span className="gradient-text">Tutor</span>
              </h1>
              <p className="text-body-lg text-muted-foreground mb-8">
                Browse our verified expert tutors and find the perfect match for your learning goals.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search tutors by name or subject..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none text-foreground"
                  />
                </div>
                <Button variant="gradient" size="lg" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto container-padding">
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <select className="px-4 py-2 rounded-lg border border-border bg-card text-foreground">
                {subjects.map((s) => <option key={s}>{s}</option>)}
              </select>
              <select className="px-4 py-2 rounded-lg border border-border bg-card text-foreground">
                {levels.map((l) => <option key={l}>{l}</option>)}
              </select>
              <select className="px-4 py-2 rounded-lg border border-border bg-card text-foreground">
                {priceRanges.map((p) => <option key={p}>{p}</option>)}
              </select>
              
              <Button variant="outline" className="ml-auto">
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                AI Match
              </Button>
              
              <select className="px-4 py-2 rounded-lg border border-border bg-card text-foreground">
                <option>Sort by: Recommended</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Rating</option>
                <option>Experience</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : tutors.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Tutors Available Yet</h3>
                <p className="text-muted-foreground">
                  Tutors will appear here once they complete their profiles.
                </p>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground mb-6">
                  Showing <span className="font-semibold text-foreground">{tutors.length}</span> tutors
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tutors.map((tutor, index) => (
                    <motion.div
                      key={tutor.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-2xl border border-border p-6 card-hover relative group"
                    >
                      {tutor.verified && (
                        <span className="absolute top-4 right-4 px-2 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
                          Verified ✓
                        </span>
                      )}

                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-16 h-16 ${tutor.avatarColor} rounded-2xl flex items-center justify-center text-2xl font-bold text-white`}>
                          {tutor.avatar}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-foreground">{tutor.name}</h3>
                          <p className="text-sm text-muted-foreground">{tutor.education}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="w-4 h-4 fill-accent text-accent" />
                            <span className="font-semibold text-foreground">{tutor.rating.toFixed(1)}</span>
                            <span className="text-muted-foreground text-sm">({tutor.reviews} reviews)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {tutor.subjects.map((subject) => (
                          <span key={subject} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                            {subject}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-2xl font-bold text-primary">PKR {tutor.price.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">per hour</p>
                        </div>
                        <span className="text-sm text-muted-foreground">{tutor.experience}</span>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="gradient" className="flex-1" asChild>
                          <Link to="/signup">Book Demo</Link>
                        </Button>
                        <Button variant="outline" size="icon">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <AIChatbot />
    </div>
  );
};

export default TutorsPage;
