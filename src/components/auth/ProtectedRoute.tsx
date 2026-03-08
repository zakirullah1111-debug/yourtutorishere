import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { checkTutorProfileComplete } from "@/lib/fetchProfileWithRetry";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("student" | "tutor" | "admin" | "moderator")[];
  requireCompleteProfile?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, requireCompleteProfile = false }: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      if (loading) return;

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        // Redirect to their own dashboard
        if (userRole === "student") navigate("/dashboard/student", { replace: true });
        else if (userRole === "tutor") navigate("/dashboard/tutor", { replace: true });
        else navigate("/", { replace: true });
        return;
      }

      if (requireCompleteProfile && userRole === "tutor" && user) {
        const isComplete = await checkTutorProfileComplete(user.id);
        if (!isComplete) {
          navigate("/dashboard/tutor/complete-profile", { replace: true });
          return;
        }
      }

      setChecking(false);
    }
    check();
  }, [user, loading, userRole, navigate, allowedRoles, requireCompleteProfile]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
