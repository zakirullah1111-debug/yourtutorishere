import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import SubjectsPage from "./pages/SubjectsPage";
import TutorsPage from "./pages/TutorsPage";
import PricingPage from "./pages/PricingPage";
import AboutPage from "./pages/AboutPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

// Student Dashboard Pages
import StudentDashboard from "./pages/dashboard/student/StudentDashboard";
import FindTutors from "./pages/dashboard/student/FindTutors";
import MyTutors from "./pages/dashboard/student/MyTutors";
import MySessions from "./pages/dashboard/student/MySessions";
import StudentMessages from "./pages/dashboard/student/Messages";
import StudentProgress from "./pages/dashboard/student/Progress";
import StudentPayments from "./pages/dashboard/student/Payments";
import StudentSettings from "./pages/dashboard/student/Settings";
import TutorProfile from "./pages/dashboard/student/TutorProfile";
import StudentBookings from "./pages/dashboard/student/Bookings";

// Tutor Dashboard Pages
import TutorDashboard from "./pages/dashboard/tutor/TutorDashboard";
import MyStudents from "./pages/dashboard/tutor/MyStudents";
import TutorSchedule from "./pages/dashboard/tutor/Schedule";
import TutorMessages from "./pages/dashboard/tutor/Messages";
import TutorEarnings from "./pages/dashboard/tutor/Earnings";
import TutorReviews from "./pages/dashboard/tutor/Reviews";
import TutorResources from "./pages/dashboard/tutor/Resources";
import TutorSettings from "./pages/dashboard/tutor/Settings";
import CompleteProfile from "./pages/dashboard/tutor/CompleteProfile";
import TutorBookings from "./pages/dashboard/tutor/Bookings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/tutors" element={<TutorsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* Student Dashboard Routes - Protected */}
            <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/student/find-tutors" element={<ProtectedRoute allowedRoles={["student"]}><FindTutors /></ProtectedRoute>} />
            <Route path="/dashboard/student/my-tutors" element={<ProtectedRoute allowedRoles={["student"]}><MyTutors /></ProtectedRoute>} />
            <Route path="/dashboard/student/sessions" element={<ProtectedRoute allowedRoles={["student"]}><MySessions /></ProtectedRoute>} />
            <Route path="/dashboard/student/bookings" element={<ProtectedRoute allowedRoles={["student"]}><StudentBookings /></ProtectedRoute>} />
            <Route path="/dashboard/student/messages" element={<ProtectedRoute allowedRoles={["student"]}><StudentMessages /></ProtectedRoute>} />
            <Route path="/dashboard/student/progress" element={<ProtectedRoute allowedRoles={["student"]}><StudentProgress /></ProtectedRoute>} />
            <Route path="/dashboard/student/payments" element={<ProtectedRoute allowedRoles={["student"]}><StudentPayments /></ProtectedRoute>} />
            <Route path="/dashboard/student/settings" element={<ProtectedRoute allowedRoles={["student"]}><StudentSettings /></ProtectedRoute>} />
            <Route path="/dashboard/student/tutor/:tutorId" element={<ProtectedRoute allowedRoles={["student"]}><TutorProfile /></ProtectedRoute>} />
            
            {/* Tutor Dashboard Routes - Protected */}
            <Route path="/dashboard/tutor" element={<ProtectedRoute allowedRoles={["tutor"]} requireCompleteProfile><TutorDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/tutor/students" element={<ProtectedRoute allowedRoles={["tutor"]} requireCompleteProfile><MyStudents /></ProtectedRoute>} />
            <Route path="/dashboard/tutor/schedule" element={<ProtectedRoute allowedRoles={["tutor"]} requireCompleteProfile><TutorSchedule /></ProtectedRoute>} />
            <Route path="/dashboard/tutor/messages" element={<ProtectedRoute allowedRoles={["tutor"]} requireCompleteProfile><TutorMessages /></ProtectedRoute>} />
            <Route path="/dashboard/tutor/earnings" element={<ProtectedRoute allowedRoles={["tutor"]} requireCompleteProfile><TutorEarnings /></ProtectedRoute>} />
            <Route path="/dashboard/tutor/reviews" element={<ProtectedRoute allowedRoles={["tutor"]} requireCompleteProfile><TutorReviews /></ProtectedRoute>} />
            <Route path="/dashboard/tutor/resources" element={<ProtectedRoute allowedRoles={["tutor"]} requireCompleteProfile><TutorResources /></ProtectedRoute>} />
            <Route path="/dashboard/tutor/settings" element={<ProtectedRoute allowedRoles={["tutor"]} requireCompleteProfile><TutorSettings /></ProtectedRoute>} />
            <Route path="/dashboard/tutor/complete-profile" element={<ProtectedRoute allowedRoles={["tutor"]}><CompleteProfile /></ProtectedRoute>} />
            <Route path="/dashboard/tutor/bookings" element={<ProtectedRoute allowedRoles={["tutor"]} requireCompleteProfile><TutorBookings /></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
