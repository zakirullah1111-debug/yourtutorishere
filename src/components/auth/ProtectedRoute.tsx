import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { checkTutorProfileComplete } from "@/lib/fetchProfileWithRetry";
import { Loader2, Zap } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("student" | "tutor" | "admin" | "moderator")[];
  requireCompleteProfile?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireCompleteProfile = false,
}: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Don't run until auth has fully resolved
    if (loading) return;
    // Don't run until role has been fetched for logged-in users
    if (user && userRole === null) return;

    async function check() {
      // 1. Not logged in → go to login
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      // 2. Wrong role → redirect to their own dashboard
      if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        if (userRole === "student") navigate("/dashboard/student", { replace: true });
        else if (userRole === "tutor") navigate("/dashboard/tutor", { replace: true });
        else navigate("/", { replace: true });
        return;
      }

      // 3. Tutor profile completeness gate
      if (requireCompleteProfile && userRole === "tutor") {
        const isComplete = await checkTutorProfileComplete(user.id);
        if (!isComplete) {
          navigate("/dashboard/tutor/complete-profile", { replace: true });
          return;
        }
      }

      // All checks passed — show the page
      setChecking(false);
    }

    check();
  }, [user, loading, userRole, navigate, allowedRoles, requireCompleteProfile]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center">
          <Zap className="w-6 h-6 text-white fill-white" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
