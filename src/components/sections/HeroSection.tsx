import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Sparkles, Home, Trees, Users, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Import lifestyle images
import cozyFireplace from "@/assets/lifestyle-cozy-fireplace.jpg";
import comfortHome from "@/assets/lifestyle-comfort-home.jpg";
import greenOutdoors from "@/assets/lifestyle-green-outdoors.jpg";
import familySupport from "@/assets/lifestyle-family-support.jpg";

const lifestyleScenes = [
  {
    image: cozyFireplace,
    title: "Learn by the Fireplace",
    subtitle: "Winter evenings, warm blankets, quality education",
    icon: Flame,
    color: "from-orange-500/20 to-red-500/20",
  },
  {
    image: comfortHome,
    title: "Your Comfort, Your Class",
    subtitle: "No commute, no stress, just learning",
    icon: Home,
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    image: greenOutdoors,
    title: "Nature as Your Classroom",
    subtitle: "Fresh air, green fields, clear mind",
    icon: Trees,
    color: "from-green-500/20 to-emerald-500/20",
  },
  {
    image: familySupport,
    title: "Family Learning Together",
    subtitle: "Parents involved, children thriving",
    icon: Users,
    color: "from-purple-500/20 to-pink-500/20",
  },
];

export function HeroSection() {
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScene((prev) => (prev + 1) % lifestyleScenes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentScene = lifestyleScenes[activeScene];
  const IconComponent = currentScene.icon;

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Animated Background Images */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScene}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <img
              src={currentScene.image}
              alt={currentScene.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
            <div className={`absolute inset-0 bg-gradient-to-br ${currentScene.color} opacity-30`} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="container mx-auto container-padding relative z-10 pt-24 lg:pt-32">
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Learning Platform</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-display-3 md:text-display-2 lg:text-display-1 font-extrabold text-foreground mb-6 text-balance">
              Learn From{" "}
              <span className="gradient-text">Anywhere</span>{" "}
              You Feel Comfortable
            </h1>

            {/* Dynamic Subtitle based on active scene */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScene}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 mb-6 justify-center lg:justify-start"
              >
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{currentScene.title}</p>
                  <p className="text-sm text-muted-foreground">{currentScene.subtitle}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Subheadline */}
            <p className="text-body-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
              Pakistan's most advanced AI-powered tutoring. Learn from your couch, 
              your garden, or anywhere with WiFi. Expert tutors, flexible schedules.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup">
                  Start Learning Now
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="bg-background/50 backdrop-blur-sm" asChild>
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

          {/* Scene Selector */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            {/* Scene Preview Cards */}
            <div className="grid grid-cols-2 gap-4">
              {lifestyleScenes.map((scene, index) => {
                const SceneIcon = scene.icon;
                return (
                  <motion.button
                    key={index}
                    onClick={() => setActiveScene(index)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative overflow-hidden rounded-2xl aspect-[4/3] transition-all duration-300 ${
                      activeScene === index
                        ? "ring-4 ring-primary shadow-2xl"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={scene.image}
                      alt={scene.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center gap-2 text-white">
                        <SceneIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{scene.title}</span>
                      </div>
                    </div>
                    {activeScene === index && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute inset-0 border-4 border-primary rounded-2xl"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute -bottom-6 -left-6 bg-card/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎓</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">5,000+</p>
                  <p className="text-sm text-muted-foreground">Students Learning from Home</p>
                </div>
              </div>
            </motion.div>

            {/* Scene Navigation Dots */}
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
              {lifestyleScenes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveScene(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeScene === index
                      ? "w-8 bg-primary"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
