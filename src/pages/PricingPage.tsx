import { motion } from "framer-motion";
import { Check, Sparkles, CreditCard, Wallet, Building } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: 500,
    description: "Perfect for trying out our platform",
    features: [
      "1-on-1 video sessions",
      "AI chatbot support",
      "Basic study materials",
      "Email support",
      "Pay per session",
    ],
    popular: false,
  },
  {
    name: "Standard",
    price: 800,
    description: "Most popular choice for students",
    features: [
      "Everything in Starter",
      "Session recordings",
      "Premium study materials",
      "Progress tracking",
      "Priority support",
      "5% discount on 10+ hours",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: 1200,
    description: "For serious learners who want the best",
    features: [
      "Everything in Standard",
      "Dedicated tutor",
      "Personalized study plan",
      "Weekly progress reports",
      "24/7 priority support",
      "10% discount on 10+ hours",
      "Parent portal access",
    ],
    popular: false,
  },
];

const packages = [
  {
    hours: 5,
    discount: "5%",
    validity: "2 months",
    popular: false,
  },
  {
    hours: 10,
    discount: "10%",
    validity: "3 months",
    popular: true,
  },
  {
    hours: 20,
    discount: "15%",
    validity: "4 months",
    popular: false,
  },
];

const faqs = [
  {
    question: "How do I know if a tutor's rate is fair?",
    answer: "Our pricing is transparent and competitive. Each tutor sets their own rate based on their qualifications and experience. You can compare tutors and read reviews to ensure you're getting value for money.",
  },
  {
    question: "Are there any additional fees?",
    answer: "No hidden fees! You only pay the tutor's hourly rate. There are no platform fees, subscription fees, or booking charges.",
  },
  {
    question: "What is a free demo and how many can I take?",
    answer: "A free demo is a 30-minute trial session with a tutor. You can book up to 3 free demo sessions with different tutors to find your perfect match before committing.",
  },
  {
    question: "How will I pay?",
    answer: "We accept JazzCash, EasyPaisa, bank transfers, and debit/credit cards. You can also use PayPal for international payments.",
  },
  {
    question: "Can I negotiate the rate with my tutor?",
    answer: "Yes! After your demo session, you can discuss package deals or bulk discounts directly with your tutor.",
  },
];

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="gradient-subtle py-16">
          <div className="container mx-auto container-padding text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium mb-6">
                <Wallet className="w-4 h-4" />
                Best Prices in Pakistan
              </span>
              <h1 className="text-display-3 md:text-display-2 font-bold text-foreground mb-4">
                Simple, <span className="gradient-text">Transparent</span> Pricing
              </h1>
              <p className="text-body-lg text-muted-foreground">
                No hidden fees. Pay only for what you use. Start with 3 free demo classes!
              </p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Plans */}
        <section className="py-16">
          <div className="container mx-auto container-padding">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-card rounded-3xl p-8 border-2 ${
                    plan.popular ? "border-primary shadow-primary" : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 gradient-bg text-white text-sm font-semibold rounded-full">
                      Most Popular ⭐
                    </span>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-foreground">PKR {plan.price}</span>
                      <span className="text-muted-foreground">/hour</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.popular ? "gradient" : "outline"}
                    className="w-full"
                    size="lg"
                    asChild
                  >
                    <Link to="/signup">Get Started</Link>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Package Deals */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto container-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-heading-1 font-bold text-foreground mb-4">
                Save More with <span className="gradient-text">Package Deals</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Buy hours in bulk and save up to 15% on your learning journey.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.hours}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-card rounded-2xl p-6 border-2 text-center ${
                    pkg.popular ? "border-primary" : "border-border"
                  }`}
                >
                  {pkg.popular && (
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-4">
                      Best Value
                    </span>
                  )}
                  <h3 className="text-3xl font-bold text-foreground mb-2">{pkg.hours} Hours</h3>
                  <p className="text-2xl font-bold text-primary mb-2">{pkg.discount} OFF</p>
                  <p className="text-muted-foreground text-sm">Valid for {pkg.validity}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Special Offers */}
        <section className="py-16">
          <div className="container mx-auto container-padding">
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl p-6 border border-primary/20"
              >
                <span className="text-3xl mb-4 block">🎉</span>
                <h3 className="text-lg font-bold text-foreground mb-2">Special Offer</h3>
                <p className="text-muted-foreground">Get 3 FREE demo classes with any package!</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-accent/10 to-orange-500/10 rounded-2xl p-6 border border-accent/20"
              >
                <span className="text-3xl mb-4 block">🎓</span>
                <h3 className="text-lg font-bold text-foreground mb-2">Student Discount</h3>
                <p className="text-muted-foreground">10% off for full-time students with valid ID</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-success/10 to-emerald-500/10 rounded-2xl p-6 border border-success/20"
              >
                <span className="text-3xl mb-4 block">👥</span>
                <h3 className="text-lg font-bold text-foreground mb-2">Refer a Friend</h3>
                <p className="text-muted-foreground">Get PKR 500 credit for each successful referral</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto container-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">Accepted Payment Methods</h3>
              <div className="flex flex-wrap justify-center gap-6">
                {["JazzCash", "EasyPaisa", "Bank Transfer", "Credit/Debit Card", "PayPal"].map((method) => (
                  <div key={method} className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{method}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto container-padding max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-heading-1 font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
            </motion.div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.details
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-card rounded-xl border border-border p-6"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-foreground">
                    {faq.question}
                    <span className="ml-4 text-primary group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <p className="mt-4 text-muted-foreground">{faq.answer}</p>
                </motion.details>
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

export default PricingPage;
