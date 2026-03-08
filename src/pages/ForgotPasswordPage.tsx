import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = z.string().email().safeParse(email);
    if (!result.success) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    // Always show success (prevents email enumeration)
    setSubmitted(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">
            Your<span className="gradient-text">-Tutor</span>
          </span>
        </Link>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-heading-1 font-bold text-foreground">Check your inbox</h1>
            <p className="text-muted-foreground">
              If an account exists with this email, a password reset link has been sent.
              The link expires in 1 hour.
            </p>
            <Link to="/login">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-heading-1 font-bold text-foreground mb-2">Forgot password?</h1>
            <p className="text-muted-foreground mb-8">
              Enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border ${error ? "border-destructive" : "border-border"} bg-card focus:ring-2 focus:ring-primary outline-none text-foreground`}
                    required
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="text-sm text-destructive mt-1">{error}</p>}
              </div>
              <Button type="submit" variant="gradient" size="xl" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</> : "Send Reset Link"}
              </Button>
            </form>
            <p className="text-center mt-6 text-muted-foreground">
              <Link to="/login" className="text-primary font-semibold hover:underline">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Back to Login
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
