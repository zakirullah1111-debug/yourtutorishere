import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import {
  User,
  Settings,
  LogOut,
  BookOpen,
  GraduationCap,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
}

interface StudentInfo {
  current_class?: string;
  primary_subject?: string;
  secondary_subject?: string;
  additional_subjects?: string[];
}

export function UserProfileDropdown() {
  const { user, signOut, userRole } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, avatar_url")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      } else {
        // Use auth metadata as fallback
        setProfile({
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          email: user.email || "",
          avatar_url: user.user_metadata?.avatar_url,
        });
      }

      // Fetch student info if user is a student
      if (userRole === "student") {
        const { data: studentData } = await supabase
          .from("students")
          .select("current_class, primary_subject, secondary_subject, additional_subjects")
          .eq("user_id", user.id)
          .single();

        if (studentData) {
          setStudentInfo(studentData);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDashboardPath = () => {
    switch (userRole) {
      case "student":
        return "/dashboard/student";
      case "tutor":
        return "/dashboard/tutor";
      case "admin":
        return "/dashboard/admin";
      default:
        return "/";
    }
  };

  const getSettingsPath = () => {
    switch (userRole) {
      case "student":
        return "/dashboard/student/settings";
      case "tutor":
        return "/dashboard/tutor/settings";
      default:
        return "/dashboard/student/settings";
    }
  };

  const userInitials =
    (profile?.first_name?.[0] || user?.user_metadata?.first_name?.[0] || "").toUpperCase() +
    (profile?.last_name?.[0] || user?.user_metadata?.last_name?.[0] || "").toUpperCase();

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
    : user?.email?.split("@")[0] || "User";

  // Get all subjects as a list
  const subjects = studentInfo
    ? [
        studentInfo.primary_subject,
        studentInfo.secondary_subject,
        ...(studentInfo.additional_subjects || []),
      ].filter(Boolean)
    : [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {userInitials || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline-block text-sm font-medium max-w-[100px] truncate">
            {displayName.split(" ")[0]}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {/* User Info Section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-medium">
                {userInitials || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground truncate">
                {profile?.email || user?.email}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full capitalize">
                {userRole || "User"}
              </span>
            </div>
          </div>

          {/* Student-specific info */}
          {userRole === "student" && studentInfo && (
            <div className="mt-4 space-y-2">
              {studentInfo.current_class && (
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Class:</span>
                  <span className="font-medium text-foreground">{studentInfo.current_class}</span>
                </div>
              )}
              {subjects.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">Subjects:</span>
                  <div className="flex flex-wrap gap-1">
                    {subjects.slice(0, 3).map((subject, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 text-xs bg-muted rounded-full text-foreground"
                      >
                        {subject}
                      </span>
                    ))}
                    {subjects.length > 3 && (
                      <span className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground">
                        +{subjects.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="p-2">
          <DropdownMenuItem asChild>
            <Link to={getDashboardPath()} className="flex items-center gap-2 cursor-pointer">
              <User className="w-4 h-4" />
              <span>My Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={getSettingsPath()} className="flex items-center gap-2 cursor-pointer">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        <div className="p-2">
          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
