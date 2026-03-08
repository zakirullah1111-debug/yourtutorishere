import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { UserProfileDropdown } from "./UserProfileDropdown";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Subjects", href: "/subjects" },
  { name: "Find Tutors", href: "/tutors" },
  { name: "Pricing", href: "/pricing" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About", href: "/about" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, loading, userRole } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-lg shadow-md py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto container-padding">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Your<span className="gradient-text">-Tutor</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            {!loading && user ? (
              <UserProfileDropdown />
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button variant="gradient" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </nav>

      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[9998] bg-black/50 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed top-0 right-0 z-[9999] h-screen w-4/5 max-w-[320px] bg-background shadow-[-4px_0_24px_rgba(0,0,0,0.15)] overflow-y-auto lg:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-5 border-b border-border">
                <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-foreground">
                    Your<span className="gradient-text">-Tutor</span>
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Nav Links */}
              <div className="py-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "block px-6 py-3.5 text-base font-medium transition-colors border-b border-border/30",
                      location.pathname === link.href
                        ? "text-primary bg-primary/10"
                        : "text-foreground hover:bg-primary/5 hover:text-primary"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-border mx-4 my-2" />

              {/* CTA Buttons */}
              <div className="px-6 py-4 flex flex-col gap-2">
                {!loading && user ? (
                  <Button variant="gradient" asChild className="w-full h-11 rounded-lg font-semibold">
                    <Link to={userRole === "tutor" ? "/dashboard/tutor" : "/dashboard/student"} onClick={() => setIsMobileMenuOpen(false)}>
                      Go to Dashboard →
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" asChild className="w-full h-11 rounded-lg border-primary text-primary">
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Log In</Link>
                    </Button>
                    <Button variant="gradient" asChild className="w-full h-11 rounded-lg font-semibold">
                      <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>Sign Up Free</Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
