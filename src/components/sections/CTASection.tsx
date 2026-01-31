import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="section-padding">
      <div className="container mx-auto container-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden gradient-bg rounded-3xl p-8 md:p-16 text-center"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          
          {/* Floating Stars */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-10 right-10 opacity-30"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-10 left-10 opacity-30"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>

          <div className="relative z-10">
            <h2 className="text-heading-1 md:text-display-3 font-bold text-white mb-4">
              Ready to Transform Your Learning Journey?
            </h2>
            <p className="text-white/80 text-body-lg max-w-2xl mx-auto mb-8">
              Join 5,000+ students already learning smarter with AI-powered tutoring. 
              Start with 3 free demo classes today!
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="xl"
                className="bg-white text-primary hover:bg-white/90 font-bold"
                asChild
              >
                <Link to="/signup">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
              <Button
                variant="hero-outline"
                size="xl"
                asChild
              >
                <Link to="/demo">
                  Schedule Demo
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white/50" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white/50" />
                3 free demo classes
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white/50" />
                Cancel anytime
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
