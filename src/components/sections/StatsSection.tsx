import { motion } from "framer-motion";
import { Users, GraduationCap, Clock, Trophy } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "5,000+",
    label: "Active Students",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: GraduationCap,
    value: "500+",
    label: "Expert Tutors",
    color: "bg-accent/20 text-accent-foreground",
  },
  {
    icon: Trophy,
    value: "98%",
    label: "Success Rate",
    color: "bg-success/10 text-success",
  },
  {
    icon: Clock,
    value: "50,000+",
    label: "Hours Taught",
    color: "bg-primary/10 text-primary",
  },
];

export function StatsSection() {
  return (
    <section className="py-16 relative z-10">
      <div className="container mx-auto container-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-card rounded-3xl border border-border shadow-xl p-8 md:p-12"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`w-16 h-16 ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className="w-8 h-8" />
                </div>
                <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  {stat.value}
                </p>
                <p className="text-muted-foreground text-sm md:text-base">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
