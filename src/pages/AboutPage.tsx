import { motion } from "framer-motion";
import { Target, Heart, Shield, Lightbulb, Users, Globe, Linkedin } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AIChatbot } from "@/components/chat/AIChatbot";

const values = [
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "Leveraging AI and cutting-edge technology to create the best learning experience possible.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Heart,
    title: "Accessibility",
    description: "Making quality education affordable and accessible to every student in Pakistan.",
    color: "bg-accent/20 text-accent-foreground",
  },
  {
    icon: Shield,
    title: "Quality",
    description: "Only verified, background-checked tutors with proven track records of student success.",
    color: "bg-success/10 text-success",
  },
  {
    icon: Users,
    title: "Support",
    description: "24/7 assistance through our AI chatbot and dedicated support team.",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: Target,
    title: "Transparency",
    description: "Clear pricing with no hidden fees. What you see is what you pay.",
    color: "bg-pink-100 text-pink-600",
  },
  {
    icon: Globe,
    title: "Community",
    description: "Building a nationwide community of learners and educators working together.",
    color: "bg-emerald-100 text-emerald-600",
  },
];

const team = [
  {
    name: "Ali Hassan",
    role: "Founder & CEO",
    bio: "Former Google engineer passionate about education technology.",
    avatar: "A",
    color: "bg-primary",
  },
  {
    name: "Sana Malik",
    role: "Head of Education",
    bio: "10+ years in curriculum development and teacher training.",
    avatar: "S",
    color: "bg-accent",
  },
  {
    name: "Bilal Ahmed",
    role: "CTO",
    bio: "Built AI systems at multiple EdTech startups.",
    avatar: "B",
    color: "bg-success",
  },
  {
    name: "Ayesha Khan",
    role: "Head of Operations",
    bio: "Scaling operations across Pakistan's education sector.",
    avatar: "A",
    color: "bg-pink-500",
  },
];

const milestones = [
  { year: "2022", event: "Your-Tutor founded with a vision to transform education" },
  { year: "2023", event: "Launched AI-powered learning assistant" },
  { year: "2024", event: "Reached 5,000+ active students" },
  { year: "2025", event: "Integrated Zoom for seamless video sessions" },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="gradient-subtle py-20">
          <div className="container mx-auto container-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-display-3 md:text-display-2 font-bold text-foreground mb-6">
                Our Mission: Making Quality Education{" "}
                <span className="gradient-text">Accessible</span>
              </h1>
              <p className="text-body-lg text-muted-foreground">
                We believe every student in Pakistan deserves access to world-class tutoring, 
                regardless of their location or background. That's why we built Your-Tutor.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="container mx-auto container-padding">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-primary font-semibold text-sm uppercase tracking-wider">Our Story</span>
                <h2 className="text-heading-1 font-bold text-foreground mt-2 mb-6">
                  From a Simple Idea to Pakistan's Leading EdTech Platform
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Your-Tutor was born out of a simple frustration: finding quality tutoring in Pakistan 
                    shouldn't be this hard. Students were juggling multiple apps, facing unreliable tutors, 
                    and struggling with confusing pricing.
                  </p>
                  <p>
                    We set out to create an all-in-one platform that combines the power of AI with 
                    human expertise. A place where students can find verified tutors, attend live 
                    sessions, and get 24/7 support - all in one seamless experience.
                  </p>
                  <p>
                    Today, we're proud to serve 5,000+ students across Pakistan, helping them achieve 
                    their academic goals with the support of 500+ expert tutors.
                  </p>
                </div>
              </motion.div>

              {/* Timeline */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-card rounded-3xl p-8 border border-border"
              >
                <h3 className="text-xl font-bold text-foreground mb-6">Our Journey</h3>
                <div className="space-y-6">
                  {milestones.map((milestone, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-16 h-16 gradient-bg rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                        {milestone.year}
                      </div>
                      <div className="flex-1 pt-3">
                        <p className="text-foreground">{milestone.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto container-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Our Values</span>
              <h2 className="text-heading-1 font-bold text-foreground mt-2">
                What We Stand For
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 border border-border card-hover"
                >
                  <div className={`w-12 h-12 ${value.color} rounded-xl flex items-center justify-center mb-4`}>
                    <value.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16">
          <div className="container mx-auto container-padding">
            <div className="gradient-bg rounded-3xl p-12 text-center">
              <h2 className="text-heading-1 font-bold text-white mb-8">Our Impact</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: "5,000+", label: "Students Helped" },
                  { value: "50,000+", label: "Hours Taught" },
                  { value: "15%", label: "Avg. Grade Improvement" },
                  { value: "98%", label: "Student Satisfaction" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-4xl font-bold text-white mb-2">{stat.value}</p>
                    <p className="text-white/70">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto container-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Our Team</span>
              <h2 className="text-heading-1 font-bold text-foreground mt-2">
                Meet the People Behind Your-Tutor
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 border border-border text-center card-hover"
                >
                  <div className={`w-20 h-20 ${member.color} rounded-2xl flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4`}>
                    {member.avatar}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{member.name}</h3>
                  <p className="text-primary text-sm font-medium mb-2">{member.role}</p>
                  <p className="text-muted-foreground text-sm mb-4">{member.bio}</p>
                  <a href="#" className="inline-flex items-center gap-1 text-primary hover:underline">
                    <Linkedin className="w-4 h-4" />
                    <span className="text-sm">LinkedIn</span>
                  </a>
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

export default AboutPage;
