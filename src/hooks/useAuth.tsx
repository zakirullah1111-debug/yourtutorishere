import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchProfileWithRetry, fetchUserRoleWithRetry } from "@/lib/fetchProfileWithRetry";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; role?: string }>;
  signOut: () => Promise<void>;
  userRole: "student" | "tutor" | "admin" | "moderator" | null;
}

interface SignUpMetadata {
  firstName: string;
  lastName: string;
  phone: string;
  role: "student" | "tutor";
  educationLevel?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"student" | "tutor" | "admin" | "moderator" | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === "TOKEN_REFRESHED" && !session) {
          // Session expired and couldn't be refreshed
          setUserRole(null);
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
        } else if (event === "SIGNED_OUT") {
          setUserRole(null);
        } else if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const role = await fetchUserRoleWithRetry(userId);
      setUserRole(role as "student" | "tutor" | "admin" | "moderator");
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole("student");
    }
  };

  const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: metadata.firstName,
            last_name: metadata.lastName,
            phone: metadata.phone,
            role: metadata.role,
          },
        },
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        // Wait for the database trigger to create profile & role
        const profile = await fetchProfileWithRetry(data.user.id);
        if (!profile) {
          console.warn("Profile not found after retries, continuing anyway");
        }

        // Also ensure role exists (trigger should create it)
        const role = await fetchUserRoleWithRetry(data.user.id);
        setUserRole(role as "student" | "tutor" | "admin" | "moderator");

        // Create student record if needed
        if (metadata.role === "student") {
          const { error: studentError } = await supabase
            .from("students")
            .insert({
              user_id: data.user.id,
              primary_subject: "Mathematics",
            });
          if (studentError && !studentError.message.includes("duplicate")) {
            console.error("Error creating student record:", studentError);
          }
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        const role = await fetchUserRoleWithRetry(data.user.id);
        setUserRole(role as "student" | "tutor" | "admin" | "moderator");
        return { error: null, role };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        userRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
