import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Video, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-illustration.png";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-subtle" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      
      {/* Floating Icons */}
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-[10%] hidden lg:block"
      >
        <div className="w-14 h-14 gradient-bg rounded-2xl flex items-center justify-center shadow-primary">
          <Brain className="w-7 h-7 text-white" />
        </div>
      </motion.div>
      
      <motion.div
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 right-[15%] hidden lg:block"
      >
        <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shadow-lg">
          <Video className="w-6 h-6 text-accent-foreground" />
        </div>
      </motion.div>

      <div className="container mx-auto container-padding pt-24 lg:pt-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Learning Platform</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-display-3 md:text-display-2 lg:text-display-1 font-extrabold text-foreground mb-6 text-balance">
              Pakistan's Most Advanced{" "}
              <span className="gradient-text">AI-Powered</span>{" "}
              Tutoring Platform
            </h1>

            {/* Subheadline */}
            <p className="text-body-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
              All-in-one learning platform with integrated Zoom sessions, 24/7 AI assistant, 
              and verified expert tutors. No more switching between apps!
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup">
                  Start Learning Now
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/demo" className="group">
                  <Play className="w-5 h-5 mr-1 group-hover:text-primary transition-colors" />
                  Book Free Demo
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-success" />
                </span>
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-success" />
                </span>
                3 free demo classes
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-success" />
                </span>
                Cancel anytime
              </div>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className="relative z-10">
              <img
                src={heroImage}
                alt="Student learning with AI-powered tutoring platform"
                className="w-full h-auto rounded-3xl shadow-2xl"
              />
              
              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">5,000+</p>
                    <p className="text-sm text-muted-foreground">Active Students</p>
                  </div>
                </div>
              </motion.div>

              {/* AI Badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="absolute -top-4 -right-4 bg-accent text-accent-foreground px-4 py-2 rounded-full font-semibold text-sm shadow-lg"
              >
                24/7 AI Support ✨
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
