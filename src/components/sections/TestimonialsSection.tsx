import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Ayesha Khan",
    level: "O-Level Student",
    avatar: "A",
    avatarColor: "bg-pink-500",
    rating: 5,
    review: "The AI chatbot is amazing! I can ask questions anytime and get instant help. My Physics grades went from C to A* in just 3 months. The tutors here truly care about student success.",
  },
  {
    name: "Muhammad Ali",
    level: "A-Level Student",
    avatar: "M",
    avatarColor: "bg-primary",
    rating: 5,
    review: "Having Zoom integrated directly in the platform is so convenient. No more confusion with links! My Chemistry tutor is excellent and the session recordings help me revise before exams.",
  },
  {
    name: "Fatima Ahmed",
    level: "Matric Student",
    avatar: "F",
    avatarColor: "bg-accent",
    rating: 5,
    review: "Best pricing in Pakistan! My parents were worried about costs, but the flexible packages work perfectly for us. My Math grades improved from 60% to 92% in one term.",
  },
  {
    name: "Hassan Raza",
    level: "Intermediate",
    avatar: "H",
    avatarColor: "bg-success",
    rating: 5,
    review: "I tried many tutoring platforms before, but Your-Tutor is different. The AI recommendations found me the perfect English tutor. Now I'm confident in my speaking skills!",
  },
  {
    name: "Zainab Malik",
    level: "O-Level Student",
    avatar: "Z",
    avatarColor: "bg-indigo-500",
    rating: 5,
    review: "The progress tracking feature helped me identify my weak areas in Biology. My tutor created a personalized plan, and I scored straight A's in my mock exams!",
  },
  {
    name: "Ahmed Hussain",
    level: "A-Level Student",
    avatar: "A",
    avatarColor: "bg-orange-500",
    rating: 5,
    review: "Preparing for Economics seemed impossible until I found Your-Tutor. The 24/7 AI support means I can get help even at midnight before exams. Absolute game-changer!",
  },
];

export function TestimonialsSection() {
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
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Testimonials</span>
          <h2 className="text-heading-1 md:text-display-3 font-bold text-foreground mt-2 mb-4">
            Loved by{" "}
            <span className="gradient-text">5,000+ Students</span>
          </h2>
          <p className="text-muted-foreground text-body-lg max-w-2xl mx-auto">
            Don't just take our word for it. Here's what students and parents say about their experience.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border card-hover relative"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.review}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${testimonial.avatarColor} rounded-full flex items-center justify-center text-white font-bold`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.level}</p>
                </div>
                <div className="ml-auto">
                  <span className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
                    Verified
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
