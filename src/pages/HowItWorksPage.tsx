import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { UserPlus, Search, Sparkles, MessageSquare, Calendar, Rocket, Video, Star, BookOpen, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const studentSteps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Account",
    description: "Sign up in under 2 minutes with your email or phone number. No credit card required.",
  },
  {
    number: "02",
    icon: Search,
    title: "Tell Us What You Need",
    description: "Select your subjects, educational level (O-Level, A-Level, Matric), and schedule preferences.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Get AI Recommendations",
    description: "Our AI analyzes your requirements and suggests the best-matched tutors for your learning style.",
  },
  {
    number: "04",
    icon: MessageSquare,
    title: "Book Free Demo",
    description: "Schedule up to 3 free demo classes with different tutors. Try before you commit!",
  },
  {
    number: "05",
    icon: Calendar,
    title: "Choose Your Tutor",
    description: "After demos, select the tutor you connected with best and book your regular sessions.",
  },
  {
    number: "06",
    icon: Video,
    title: "Join Sessions",
    description: "Attend live Zoom classes directly from your dashboard. No external links or apps needed.",
  },
  {
    number: "07",
    icon: BookOpen,
    title: "Access Resources",
    description: "Get study materials, session recordings, and AI-powered study assistance 24/7.",
  },
  {
    number: "08",
    icon: TrendingUp,
    title: "Track Progress",
    description: "Monitor your improvement with detailed analytics and personalized progress reports.",
  },
];

const tutorSteps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Apply to Join",
    description: "Fill out your application with qualifications, experience, and subjects you teach.",
  },
  {
    number: "02",
    icon: Star,
    title: "Verification",
    description: "Complete our verification process including background check and demo teaching session.",
  },
  {
    number: "03",
    icon: BookOpen,
    title: "Create Profile",
    description: "Set up your profile with bio, subjects, pricing, and upload an introduction video.",
  },
  {
    number: "04",
    icon: Calendar,
    title: "Set Availability",
    description: "Manage your teaching schedule with our calendar. Sync with your personal calendar.",
  },
  {
    number: "05",
    icon: MessageSquare,
    title: "Receive Requests",
    description: "Get notifications for demo requests and review student profiles before accepting.",
  },
  {
    number: "06",
    icon: Video,
    title: "Conduct Sessions",
    description: "Start Zoom sessions directly from your dashboard with built-in teaching tools.",
  },
];

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="gradient-subtle py-20">
          <div className="container mx-auto container-padding text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <h1 className="text-display-3 md:text-display-2 font-bold text-foreground mb-6">
                How <span className="gradient-text">Your-Tutor</span> Works
              </h1>
              <p className="text-body-lg text-muted-foreground">
                From sign-up to your first class, we make the process seamless and stress-free. 
                Here's everything you need to know.
              </p>
            </motion.div>
          </div>
        </section>

        {/* For Students */}
        <section className="py-16">
          <div className="container mx-auto container-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                👨‍🎓 For Students
              </span>
              <h2 className="text-heading-1 font-bold text-foreground">
                Start Learning in 8 Simple Steps
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {studentSteps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-2xl p-6 border border-border card-hover relative"
                >
                  <span className="absolute top-4 right-4 text-4xl font-bold text-muted-foreground/10">
                    {step.number}
                  </span>
                  <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button variant="gradient" size="xl" asChild>
                <Link to="/signup">
                  Start Your Learning Journey
                  <Rocket className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* For Tutors */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto container-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium mb-4">
                👨‍🏫 For Tutors
              </span>
              <h2 className="text-heading-1 font-bold text-foreground">
                Join Our Tutor Community
              </h2>
              <p className="text-muted-foreground mt-2">
                Earn while teaching from the comfort of your home
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {tutorSteps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-2xl p-6 border border-border card-hover relative"
                >
                  <span className="absolute top-4 right-4 text-4xl font-bold text-muted-foreground/10">
                    {step.number}
                  </span>
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button variant="outline" size="xl" asChild>
                <Link to="/become-tutor">
                  Become a Tutor
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Platform Features */}
        <section className="py-16">
          <div className="container mx-auto container-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="gradient-bg rounded-3xl p-8 md:p-12"
            >
              <div className="text-center text-white mb-8">
                <h2 className="text-heading-1 font-bold mb-4">What Makes Us Different</h2>
                <p className="text-white/80 max-w-2xl mx-auto">
                  Everything you need in one platform. No switching apps, no confusion.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: "🤖", title: "AI-Powered Matching", desc: "Find the perfect tutor with our smart recommendation engine" },
                  { icon: "📹", title: "Integrated Zoom", desc: "Join live classes without leaving the platform" },
                  { icon: "💬", title: "24/7 AI Support", desc: "Get help anytime with our intelligent chatbot" },
                  { icon: "📊", title: "Progress Tracking", desc: "Monitor your improvement with detailed analytics" },
                  { icon: "🎬", title: "Session Recordings", desc: "Review any class from your personal library" },
                  { icon: "💳", title: "Easy Payments", desc: "Multiple payment options including JazzCash, EasyPaisa" },
                ].map((feature, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                    <span className="text-4xl mb-4 block">{feature.icon}</span>
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-white/70 text-sm">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <AIChatbot />
    </div>
  );
};

export default HowItWorksPage;
