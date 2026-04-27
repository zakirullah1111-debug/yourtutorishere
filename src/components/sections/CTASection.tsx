import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CTASection() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto container-padding">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden gradient-bg rounded-3xl px-8 md:px-16 py-16 md:py-20 text-center"
        >
          {/* Decorative blobs */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/8 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-white/8 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/4 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/25 text-white text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5 fill-white" />
              Start learning today — 3 free demos waiting
            </div>

            <h2 className="text-white font-bold mb-5 leading-tight">
              Your child's best results<br className="hidden sm:block" /> start with the right tutor.
            </h2>

            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
              Join 5,000+ students already learning smarter on Studypulse.
              Book your first free demo in under 2 minutes.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <div className="flex flex-col items-center gap-1.5">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/92 font-bold shadow-lg shadow-black/20 hover:shadow-xl transition-all hover:scale-[1.03] h-14 px-10 text-base rounded-xl"
                  asChild
                >
                  <Link to="/signup">
                    Find my perfect tutor
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <span className="text-white/50 text-xs italic">No credit card · 3 free demos</span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/40 text-white bg-white/10 hover:bg-white/20 font-semibold h-14 px-10 text-base rounded-xl transition-all hover:scale-[1.02]"
                  asChild
                >
                  <Link to="/signup?role=tutor">
                    I want to teach
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <span className="text-white/50 text-xs italic">Earn PKR 80K+/month</span>
              </div>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
              {[
                "No credit card required",
                "3 free demo sessions",
                "Cancel anytime",
                "500+ verified tutors",
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-white/60" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
