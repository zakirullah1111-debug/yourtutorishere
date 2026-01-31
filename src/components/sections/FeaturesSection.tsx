import { motion } from "framer-motion";
import { Brain, Video, Wallet, Target, BadgeCheck, Play } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Learning Assistant",
    description: "Get instant help 24/7 with our intelligent chatbot powered by advanced AI. Ask questions anytime, anywhere.",
    gradient: "from-primary to-purple-500",
  },
  {
    icon: Video,
    title: "Integrated Zoom Sessions",
    description: "Join live classes directly from your dashboard. No external links, no confusion - everything in one place.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Wallet,
    title: "Best Pricing in Pakistan",
    description: "Starting from just PKR 500/hour with flexible payment options. Quality education that fits your budget.",
    gradient: "from-accent to-orange-500",
  },
  {
    icon: Target,
    title: "Personalized Learning",
    description: "AI-powered recommendations and custom study plans tailored to your unique learning style and goals.",
    gradient: "from-success to-emerald-500",
  },
  {
    icon: BadgeCheck,
    title: "Verified Expert Tutors",
    description: "All tutors are verified with background checks and qualifications. Learn from the best educators in Pakistan.",
    gradient: "from-indigo-500 to-primary",
  },
  {
    icon: Play,
    title: "Session Recordings",
    description: "Review past sessions anytime from your personal library. Never miss a lesson, even if you couldn't attend live.",
    gradient: "from-pink-500 to-rose-500",
  },
];

export function FeaturesSection() {
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
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
          <h2 className="text-heading-1 md:text-display-3 font-bold text-foreground mt-2 mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Excel</span>
          </h2>
          <p className="text-muted-foreground text-body-lg max-w-2xl mx-auto">
            We've combined the best of technology and education to create a seamless learning experience.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-card rounded-2xl p-6 lg:p-8 border border-border card-hover"
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-heading-3 font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
