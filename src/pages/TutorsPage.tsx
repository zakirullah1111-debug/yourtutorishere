import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Filter, Star, Clock, MessageSquare, Heart, Sparkles, ChevronDown } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { Button } from "@/components/ui/button";

const tutors = [
  {
    id: 1,
    name: "Dr. Sarah Ahmed",
    avatar: "S",
    avatarColor: "bg-primary",
    subjects: ["Physics", "Math"],
    rating: 4.9,
    reviews: 127,
    experience: "8 years",
    education: "PhD Physics, LUMS",
    languages: ["English", "Urdu"],
    price: 1200,
    students: 450,
    successRate: "98%",
    responseTime: "< 1 hour",
    available: true,
    verified: true,
  },
  {
    id: 2,
    name: "Prof. Muhammad Raza",
    avatar: "M",
    avatarColor: "bg-success",
    subjects: ["Chemistry", "Biology"],
    rating: 4.8,
    reviews: 98,
    experience: "12 years",
    education: "MSc Chemistry, KU",
    languages: ["English", "Urdu"],
    price: 1000,
    students: 380,
    successRate: "96%",
    responseTime: "< 2 hours",
    available: true,
    verified: true,
  },
  {
    id: 3,
    name: "Ms. Fatima Khan",
    avatar: "F",
    avatarColor: "bg-accent",
    subjects: ["English", "Literature"],
    rating: 5.0,
    reviews: 215,
    experience: "6 years",
    education: "MA English, PU",
    languages: ["English", "Urdu"],
    price: 800,
    students: 520,
    successRate: "99%",
    responseTime: "< 30 mins",
    available: true,
    verified: true,
  },
  {
    id: 4,
    name: "Mr. Ahmed Hassan",
    avatar: "A",
    avatarColor: "bg-indigo-500",
    subjects: ["Economics", "Business Studies"],
    rating: 4.7,
    reviews: 76,
    experience: "5 years",
    education: "MBA, IBA",
    languages: ["English", "Urdu"],
    price: 900,
    students: 280,
    successRate: "95%",
    responseTime: "< 1 hour",
    available: false,
    verified: true,
  },
  {
    id: 5,
    name: "Hafiz Usman Ali",
    avatar: "H",
    avatarColor: "bg-emerald-500",
    subjects: ["Quran Recitation", "Islamiyat"],
    rating: 4.9,
    reviews: 342,
    experience: "15 years",
    education: "Hafiz-e-Quran, Islamic Studies",
    languages: ["Urdu", "Arabic"],
    price: 600,
    students: 890,
    successRate: "99%",
    responseTime: "< 1 hour",
    available: true,
    verified: true,
  },
  {
    id: 6,
    name: "Dr. Zainab Malik",
    avatar: "Z",
    avatarColor: "bg-pink-500",
    subjects: ["Psychology", "Sociology"],
    rating: 4.8,
    reviews: 64,
    experience: "7 years",
    education: "PhD Psychology, QAU",
    languages: ["English", "Urdu"],
    price: 1100,
    students: 195,
    successRate: "97%",
    responseTime: "< 2 hours",
    available: true,
    verified: true,
  },
];

const subjects = ["All Subjects", "Physics", "Chemistry", "Biology", "Math", "English", "Urdu", "Economics", "Business Studies", "Islamiyat"];
const levels = ["All Levels", "O-Level", "A-Level", "Matric", "Intermediate", "University"];
const priceRanges = ["Any Price", "PKR 500-800", "PKR 800-1000", "PKR 1000-1500", "PKR 1500+"];

const TutorsPage = () => {
  const [showFilters, setShowFilters] = useState(false);

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
                Browse our 500+ verified expert tutors and find the perfect match for your learning goals.
              </p>
              
              {/* Search Bar */}
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

        {/* Filters & Results */}
        <section className="py-8">
          <div className="container mx-auto container-padding">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              {/* Quick Filters */}
              <select className="px-4 py-2 rounded-lg border border-border bg-card text-foreground">
                {subjects.map((s) => <option key={s}>{s}</option>)}
              </select>
              <select className="px-4 py-2 rounded-lg border border-border bg-card text-foreground">
                {levels.map((l) => <option key={l}>{l}</option>)}
              </select>
              <select className="px-4 py-2 rounded-lg border border-border bg-card text-foreground">
                {priceRanges.map((p) => <option key={p}>{p}</option>)}
              </select>
              
              {/* AI Match Button */}
              <Button variant="outline" className="ml-auto">
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                AI Match
              </Button>
              
              {/* Sort */}
              <select className="px-4 py-2 rounded-lg border border-border bg-card text-foreground">
                <option>Sort by: Recommended</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Rating</option>
                <option>Experience</option>
              </select>
            </div>

            {/* Results Count */}
            <p className="text-muted-foreground mb-6">
              Showing <span className="font-semibold text-foreground">{tutors.length}</span> tutors
            </p>

            {/* Tutors Grid */}
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
                  {/* Verified Badge */}
                  {tutor.verified && (
                    <span className="absolute top-4 right-4 px-2 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
                      Verified ✓
                    </span>
                  )}

                  {/* Avatar & Basic Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-16 h-16 ${tutor.avatarColor} rounded-2xl flex items-center justify-center text-2xl font-bold text-white`}>
                      {tutor.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground">{tutor.name}</h3>
                      <p className="text-sm text-muted-foreground">{tutor.education}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="font-semibold text-foreground">{tutor.rating}</span>
                        <span className="text-muted-foreground text-sm">({tutor.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tutor.subjects.map((subject) => (
                      <span key={subject} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                        {subject}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="font-semibold text-foreground">{tutor.students}</p>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="font-semibold text-foreground">{tutor.successRate}</p>
                      <p className="text-xs text-muted-foreground">Success</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="font-semibold text-foreground">{tutor.experience}</p>
                      <p className="text-xs text-muted-foreground">Experience</p>
                    </div>
                  </div>

                  {/* Price & Availability */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">PKR {tutor.price}</p>
                      <p className="text-sm text-muted-foreground">per hour</p>
                    </div>
                    {tutor.available ? (
                      <span className="px-3 py-1 bg-success/10 text-success text-sm font-medium rounded-full">
                        Available Today
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-muted text-muted-foreground text-sm font-medium rounded-full">
                        Busy
                      </span>
                    )}
                  </div>

                  {/* Response Time */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4" />
                    <span>Usually responds {tutor.responseTime}</span>
                  </div>

                  {/* CTAs */}
                  <div className="flex gap-3">
                    <Button variant="gradient" className="flex-1" asChild>
                      <Link to={`/tutor/${tutor.id}`}>Book Demo</Link>
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

            {/* Load More */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Tutors
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <AIChatbot />
    </div>
  );
};

export default TutorsPage;
