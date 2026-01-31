import { motion } from "framer-motion";
import { UserPlus, Search, Sparkles, MessageSquare, Calendar, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Account",
    description: "Quick registration in under 2 minutes. No credit card required.",
    color: "bg-primary",
  },
  {
    number: "02",
    icon: Search,
    title: "Tell Us Your Needs",
    description: "Select your subjects, level, and learning preferences.",
    color: "bg-blue-500",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Get AI Recommendations",
    description: "Our AI analyzes your requirements and suggests perfect matches.",
    color: "bg-accent",
  },
  {
    number: "04",
    icon: MessageSquare,
    title: "Book Free Demo",
    description: "Schedule 3 free demo classes with different tutors to find your fit.",
    color: "bg-success",
  },
  {
    number: "05",
    icon: Calendar,
    title: "Choose Your Tutor",
    description: "After demos, select the tutor you connected with best.",
    color: "bg-indigo-500",
  },
  {
    number: "06",
    icon: Rocket,
    title: "Start Learning",
    description: "Join classes directly from your dashboard and track your progress.",
    color: "bg-primary",
  },
];

export function HowItWorksSection() {
  return (
    <section className="section-padding">
      <div className="container mx-auto container-padding">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">How It Works</span>
          <h2 className="text-heading-1 md:text-display-3 font-bold text-foreground mt-2 mb-4">
            Start Learning in{" "}
            <span className="gradient-text">6 Simple Steps</span>
          </h2>
          <p className="text-muted-foreground text-body-lg max-w-2xl mx-auto">
            From sign-up to your first class, we make the process seamless and stress-free.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector Line (desktop) */}
              {index < steps.length - 1 && index !== 2 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
              )}

              <div className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-colors relative z-10">
                {/* Step Number Badge */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center`}>
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-4xl font-bold text-muted-foreground/20">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
