import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, Phone, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const signupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  level: z.string().optional(),
});

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    level: "",
    role: "student" as "student" | "tutor",
  });

  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    try {
      signupSchema.parse({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        level: formData.level,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    const { error } = await signUp(formData.email, formData.password, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      role: formData.role,
      educationLevel: formData.role === "student" ? formData.level : undefined,
    });

    if (error) {
      let errorMessage = "Sign up failed. Please try again.";
      
      if (error.message.includes("already registered")) {
        errorMessage = "This email is already registered. Please try logging in.";
      } else if (error.message.includes("invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message.includes("weak password")) {
        errorMessage = "Password is too weak. Please use a stronger password.";
      }

      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // TODO: Re-enable email verification before production deployment
    // Email verification is temporarily disabled for faster testing iteration
    toast({
      title: "Welcome to Your-Tutor! 🎉",
      description: "Your account has been created. Redirecting to your dashboard...",
    });

    // Auto-redirect based on role after a brief delay to show the success message
    setTimeout(() => {
      if (formData.role === "student") {
        navigate("/dashboard/student");
      } else if (formData.role === "tutor") {
        navigate("/dashboard/tutor");
      } else {
        navigate("/");
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-1 gradient-bg items-center justify-center p-12">
        <div className="text-center text-white max-w-md">
          <h2 className="text-display-3 font-bold mb-4">
            Start Your Learning Journey
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Join 5,000+ students already learning smarter with AI-powered tutoring.
          </p>
          <div className="space-y-4 text-left">
            {[
              "✓ 3 free demo classes",
              "✓ AI-powered tutor matching",
              "✓ Integrated Zoom sessions",
              "✓ 24/7 learning support",
              "✓ Progress tracking",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/90">
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md py-8"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Your<span className="gradient-text">-Tutor</span>
            </span>
          </Link>

          <h1 className="text-heading-1 font-bold text-foreground mb-2">
            Create your account
          </h1>
          <p className="text-muted-foreground mb-8">
            Get started with 3 free demo classes!
          </p>

          {/* Role Toggle */}
          <div className="flex p-1 bg-muted rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "student" })}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                formData.role === "student"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
              disabled={isLoading}
            >
              I'm a Student
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "tutor" })}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                formData.role === "tutor"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
              disabled={isLoading}
            >
              I'm a Tutor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                      errors.firstName ? "border-destructive" : "border-border"
                    } bg-card focus:ring-2 focus:ring-primary outline-none text-foreground`}
                    required
                    disabled={isLoading}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.lastName ? "border-destructive" : "border-border"
                  } bg-card focus:ring-2 focus:ring-primary outline-none text-foreground`}
                  required
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                    errors.email ? "border-destructive" : "border-border"
                  } bg-card focus:ring-2 focus:ring-primary outline-none text-foreground`}
                  required
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+92 XXX XXXXXXX"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                    errors.phone ? "border-destructive" : "border-border"
                  } bg-card focus:ring-2 focus:ring-primary outline-none text-foreground`}
                  required
                  disabled={isLoading}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Education Level (Students only) */}
            {formData.role === "student" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Education Level
                </label>
                <div className="relative">
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none text-foreground appearance-none"
                    disabled={isLoading}
                  >
                    <option value="">Select your level</option>
                    <option value="o-level">O-Level</option>
                    <option value="a-level">A-Level</option>
                    <option value="matric">Matric</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="university">University</option>
                    <option value="professional">Professional</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className={`w-full pl-12 pr-12 py-3 rounded-xl border ${
                    errors.password ? "border-destructive" : "border-border"
                  } bg-card focus:ring-2 focus:ring-primary outline-none text-foreground`}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password}</p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 mt-1 rounded border-border text-primary focus:ring-primary" 
                required 
                disabled={isLoading}
              />
              <span className="text-sm text-muted-foreground">
                I agree to the{" "}
                <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </span>
            </label>

            {/* Submit */}
            <Button 
              type="submit" 
              variant="gradient" 
              size="xl" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">or sign up with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Signup */}
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" size="lg" className="w-full" disabled={isLoading}>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
            <Button variant="outline" size="lg" className="w-full" disabled={isLoading}>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>
          </div>

          {/* Login Link */}
          <p className="text-center mt-8 text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
