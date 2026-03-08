import { ReactNode, useState } from "react";
import { useSessionLinkDelivery } from "@/hooks/useSessionLinkDelivery";
import { JoinSessionPopup } from "@/components/dashboard/JoinSessionPopup";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Search,
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
  CreditCard,
  Settings,
  LogOut,
  GraduationCap,
  Menu,
  X,
  Bell,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
  userType: "student" | "tutor";
}

const studentNavItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard/student", icon: <Home className="w-5 h-5" /> },
  { label: "Find Tutors", path: "/dashboard/student/find-tutors", icon: <Search className="w-5 h-5" /> },
  { label: "My Tutors", path: "/dashboard/student/my-tutors", icon: <Users className="w-5 h-5" /> },
  { label: "My Sessions", path: "/dashboard/student/bookings", icon: <Calendar className="w-5 h-5" /> },
  { label: "Messages", path: "/dashboard/student/messages", icon: <MessageSquare className="w-5 h-5" /> },
  { label: "Progress", path: "/dashboard/student/progress", icon: <TrendingUp className="w-5 h-5" /> },
  { label: "Payments", path: "/dashboard/student/payments", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Settings", path: "/dashboard/student/settings", icon: <Settings className="w-5 h-5" /> },
];

const tutorNavItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard/tutor", icon: <Home className="w-5 h-5" /> },
  { label: "My Students", path: "/dashboard/tutor/students", icon: <Users className="w-5 h-5" /> },
  { label: "Bookings", path: "/dashboard/tutor/bookings", icon: <Calendar className="w-5 h-5" /> },
  { label: "Schedule", path: "/dashboard/tutor/schedule", icon: <Calendar className="w-5 h-5" /> },
  { label: "Messages", path: "/dashboard/tutor/messages", icon: <MessageSquare className="w-5 h-5" /> },
  { label: "Earnings", path: "/dashboard/tutor/earnings", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Reviews", path: "/dashboard/tutor/reviews", icon: <TrendingUp className="w-5 h-5" /> },
  { label: "Resources", path: "/dashboard/tutor/resources", icon: <GraduationCap className="w-5 h-5" /> },
  { label: "Settings", path: "/dashboard/tutor/settings", icon: <Settings className="w-5 h-5" /> },
];

export function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const unreadCount = useUnreadMessages(userType);
  const { activeSession, dismissPopup } = useSessionLinkDelivery();

  const navItems = userType === "student" ? studentNavItems : tutorNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const userInitials = user?.user_metadata?.first_name?.[0]?.toUpperCase() + 
    (user?.user_metadata?.last_name?.[0]?.toUpperCase() || "");

  const userName = user?.user_metadata?.first_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`
    : user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Your<span className="gradient-text">-Tutor</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {item.label === "Messages" && unreadCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-destructive text-destructive-foreground text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Welcome Message */}
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground">
                Welcome back, {userName.split(" ")[0]}!
              </h1>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-muted">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {userInitials || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/dashboard/${userType}/settings`}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
