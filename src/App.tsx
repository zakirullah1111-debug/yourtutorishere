import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import SubjectsPage from "./pages/SubjectsPage";
import TutorsPage from "./pages/TutorsPage";
import PricingPage from "./pages/PricingPage";
import AboutPage from "./pages/AboutPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
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
            
            {/* Student Dashboard Routes */}
            <Route path="/dashboard/student" element={<StudentDashboard />} />
            <Route path="/dashboard/student/find-tutors" element={<FindTutors />} />
            <Route path="/dashboard/student/my-tutors" element={<MyTutors />} />
            <Route path="/dashboard/student/sessions" element={<MySessions />} />
            <Route path="/dashboard/student/messages" element={<StudentMessages />} />
            <Route path="/dashboard/student/progress" element={<StudentProgress />} />
            <Route path="/dashboard/student/payments" element={<StudentPayments />} />
            <Route path="/dashboard/student/settings" element={<StudentSettings />} />
            
            {/* Tutor Dashboard Routes */}
            <Route path="/dashboard/tutor" element={<TutorDashboard />} />
            <Route path="/dashboard/tutor/students" element={<MyStudents />} />
            <Route path="/dashboard/tutor/schedule" element={<TutorSchedule />} />
            <Route path="/dashboard/tutor/messages" element={<TutorMessages />} />
            <Route path="/dashboard/tutor/earnings" element={<TutorEarnings />} />
            <Route path="/dashboard/tutor/reviews" element={<TutorReviews />} />
            <Route path="/dashboard/tutor/resources" element={<TutorResources />} />
            <Route path="/dashboard/tutor/settings" element={<TutorSettings />} />
            <Route path="/dashboard/tutor/complete-profile" element={<CompleteProfile />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
