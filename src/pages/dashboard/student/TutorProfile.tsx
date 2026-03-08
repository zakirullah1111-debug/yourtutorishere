import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Star,
  MapPin,
  GraduationCap,
  Globe,
  Home,
  CheckCircle,
  MessageCircle,
  BookOpen,
  Clock,
  School,
  Languages,
  ChevronDown,
  ChevronUp,
  Video,
  Play,
  Calendar,
  Rocket,
} from "lucide-react";
import { BookingModal } from "@/components/booking/BookingModal";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useMessaging } from "@/hooks/useMessaging";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TutorData {
  id: string;
  user_id: string;
  bio_summary: string | null;
  primary_subject: string;
  secondary_subject: string | null;
  additional_subjects: string[] | null;
  hourly_rate_pkr: number;
  years_of_experience: number | null;
  education_level: string;
  university: string;
  degree: string;
  school_of_teaching: string | null;
  teaching_mode: string | null;
  languages: string[] | null;
  average_rating: number | null;
  total_reviews: number | null;
  math_levels: string[] | null;
  verified: boolean | null;
  profile_complete: boolean | null;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  city: string | null;
  demo_video_type: string | null;
  demo_video_url: string | null;
  demo_video_title: string | null;
  demo_video_thumbnail: string | null;
  demo_video_duration: string | null;
  live_demo_enabled: boolean;
  live_demo_price: number | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  student_name: string;
  student_avatar: string | null;
}

export default function TutorProfile() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { getOrCreateConversation } = useMessaging("student");

  const [tutor, setTutor] = useState<TutorData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [demoVideoSignedUrl, setDemoVideoSignedUrl] = useState<string | null>(null);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    if (tutorId) fetchTutorData();
  }, [tutorId]);

  useEffect(() => {
    if (tutor) {
      document.title = `${tutor.first_name} ${tutor.last_name} — YouT utor`;
    }
    return () => { document.title = "YouT utor"; };
  }, [tutor]);

  const fetchTutorData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch tutor + profile
      const { data: tutorData, error: tutorError } = await supabase
        .from("tutors")
        .select("*")
        .eq("id", tutorId!)
        .eq("verified", true)
        .eq("profile_complete", true)
        .maybeSingle();

      if (tutorError) throw tutorError;
      if (!tutorData) {
        setError("This tutor profile is not available.");
        setLoading(false);
        return;
      }

      // Fetch profile info
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url, city")
        .eq("user_id", tutorData.user_id)
        .maybeSingle();

      const merged: TutorData = {
        ...tutorData,
        first_name: profileData?.first_name || "",
        last_name: profileData?.last_name || "",
        avatar_url: profileData?.avatar_url || null,
        city: profileData?.city || null,
        demo_video_type: (tutorData as any).demo_video_type || null,
        demo_video_url: (tutorData as any).demo_video_url || null,
        demo_video_title: (tutorData as any).demo_video_title || null,
        demo_video_thumbnail: (tutorData as any).demo_video_thumbnail || null,
        demo_video_duration: (tutorData as any).demo_video_duration || null,
        live_demo_enabled: (tutorData as any).live_demo_enabled || false,
        live_demo_price: (tutorData as any).live_demo_price || null,
      };
      setTutor(merged);

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, student_id")
        .eq("tutor_id", tutorId!)
        .order("created_at", { ascending: false })
        .limit(10);

      if (reviewsData && reviewsData.length > 0) {
        // Get student names from the students table -> profiles
        const studentIds = reviewsData.map((r) => r.student_id);
        const { data: students } = await supabase
          .from("students")
          .select("id, user_id")
          .in("id", studentIds);

        const userIds = students?.map((s) => s.user_id) || [];
        const { data: studentProfiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, avatar_url")
          .in("user_id", userIds);

        const studentMap = new Map<string, { name: string; avatar: string | null }>();
        students?.forEach((s) => {
          const prof = studentProfiles?.find((p) => p.user_id === s.user_id);
          studentMap.set(s.id, {
            name: prof?.first_name || "Student",
            avatar: prof?.avatar_url || null,
          });
        });

        setReviews(
          reviewsData.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at,
            student_name: studentMap.get(r.student_id)?.name || "Student",
            student_avatar: studentMap.get(r.student_id)?.avatar || null,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching tutor:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!user || !tutor) return;
    try {
      await getOrCreateConversation(tutor.user_id);
      navigate("/dashboard/student/messages");
    } catch {
      toast({ title: "Error", description: "Could not start conversation.", variant: "destructive" });
    }
  };

  const allSubjects = tutor
    ? [tutor.primary_subject, tutor.secondary_subject, ...(tutor.additional_subjects || [])].filter(Boolean)
    : [];

  const initials = tutor ? `${tutor.first_name[0] || ""}${tutor.last_name[0] || ""}`.toUpperCase() : "";

  const teachingModeLabel = tutor?.teaching_mode === "online"
    ? { icon: Globe, label: "Online Sessions", color: "bg-primary/10 text-primary" }
    : tutor?.teaching_mode === "in-person"
    ? { icon: Home, label: "In-Person Sessions", color: "bg-green-100 text-green-700" }
    : { icon: CheckCircle, label: "Online & In-Person", color: "bg-primary/10 text-primary" };

  const ratingBreakdown = () => {
    if (!reviews.length) return [];
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++; });
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star - 1],
      pct: Math.round((counts[star - 1] / reviews.length) * 100),
    }));
  };

  if (loading) return <TutorProfileSkeleton />;

  if (error || !tutor) {
    return (
      <DashboardLayout userType="student">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-lg text-muted-foreground">{error || "Tutor not found."}</p>
          <Button variant="outline" onClick={() => navigate("/dashboard/student/find-tutors")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Find Tutors
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="student">
      <div className="max-w-4xl mx-auto pb-28 sm:pb-8">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-4 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/dashboard/student/find-tutors")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Find Tutors
        </Button>

        {/* SECTION 1 — Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                <Avatar className="h-24 w-24 border-[3px] border-background shadow-lg shrink-0">
                  <AvatarImage src={tutor.avatar_url || undefined} alt={`${tutor.first_name} ${tutor.last_name}`} />
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                      {tutor.first_name} {tutor.last_name}
                    </h1>
                    <Tooltip>
                      <TooltipTrigger>
                        <CheckCircle className="h-5 w-5 text-primary fill-primary/20" />
                      </TooltipTrigger>
                      <TooltipContent>Verified Tutor</TooltipContent>
                    </Tooltip>
                  </div>

                  <p className="text-sm text-muted-foreground mt-1">
                    {tutor.education_level} · {tutor.university}
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 flex-wrap">
                    {(tutor.total_reviews ?? 0) > 0 ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{(tutor.average_rating ?? 0).toFixed(1)}</span>
                        <span className="text-muted-foreground">({tutor.total_reviews} reviews)</span>
                      </span>
                    ) : (
                      <Badge variant="secondary" className="text-xs">New Tutor</Badge>
                    )}
                    {tutor.city && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {tutor.city}
                      </span>
                    )}
                  </div>

                  {/* Desktop CTAs */}
                  <div className="hidden sm:flex gap-3 mt-4">
                    <Button variant="outline" onClick={handleMessage}>
                      <MessageCircle className="mr-2 h-4 w-4" /> Message
                    </Button>
                    <Button variant="default" onClick={() => toast({ title: "Coming Soon", description: "Demo booking is under development." })}>
                      <BookOpen className="mr-2 h-4 w-4" /> Book Demo Session
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mobile CTAs */}
              <div className="flex sm:hidden gap-2 mt-5">
                <Button variant="outline" className="flex-1 min-h-[44px]" onClick={handleMessage}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Message
                </Button>
                <Button className="flex-1 min-h-[44px]" onClick={() => toast({ title: "Coming Soon", description: "Demo booking is under development." })}>
                  <BookOpen className="mr-2 h-4 w-4" /> Book Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* SECTION 2 — About */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="mt-4">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">About Me</h2>

              {tutor.bio_summary ? (
                <div>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">
                    {!bioExpanded && tutor.bio_summary.length > 300
                      ? tutor.bio_summary.slice(0, 300) + "..."
                      : tutor.bio_summary}
                  </p>
                  {tutor.bio_summary.length > 300 && (
                    <button
                      className="text-sm text-primary font-medium mt-1 hover:underline flex items-center gap-1"
                      onClick={() => setBioExpanded(!bioExpanded)}
                    >
                      {bioExpanded ? "Show less" : "Read more"}
                      {bioExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No bio added yet.</p>
              )}

              {/* Languages */}
              {tutor.languages && tutor.languages.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Languages className="h-3.5 w-3.5" /> Teaches in
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tutor.languages.map((lang) => (
                      <Badge key={lang} variant="outline" className="text-xs border-primary/30 text-primary">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Teaching Mode */}
              <div className="mt-4">
                {(() => {
                  const mode = teachingModeLabel;
                  const ModeIcon = mode.icon;
                  return (
                    <Badge className={`${mode.color} border-0 text-xs px-3 py-1`}>
                      <ModeIcon className="h-3.5 w-3.5 mr-1" /> {mode.label}
                    </Badge>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* DEMO VIDEO SECTION */}
        {tutor.demo_video_url && (
          <motion.div id="demo-video" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12 }}>
            <Card className="mt-4">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-1">Watch a Demo Lesson</h2>
                <p className="text-sm text-muted-foreground mb-4">See how {tutor.first_name} teaches before you decide</p>

                <div className="rounded-xl overflow-hidden shadow-lg">
                  {tutor.demo_video_type === "upload" ? (
                    <div className="aspect-video bg-muted">
                      {demoVideoSignedUrl ? (
                        <video
                          controls
                          preload="metadata"
                          playsInline
                          poster={tutor.demo_video_thumbnail || undefined}
                          className="w-full h-full"
                          onError={() => setDemoVideoSignedUrl(null)}
                        >
                          <source src={demoVideoSignedUrl} />
                          Your browser doesn't support video playback.
                        </video>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Button
                            variant="ghost"
                            onClick={async () => {
                              const { data } = await supabase.storage.from("demo-videos").createSignedUrl(tutor.demo_video_url!, 3600);
                              if (data?.signedUrl) setDemoVideoSignedUrl(data.signedUrl);
                            }}
                          >
                            <Play className="w-8 h-8 mr-2" /> Load Video
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : tutor.demo_video_type === "youtube" ? (
                    <div className="aspect-video">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${tutor.demo_video_url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)?.[1]}?rel=0&modestbranding=1`}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title={tutor.demo_video_title || "Demo lesson"}
                      />
                    </div>
                  ) : tutor.demo_video_type === "vimeo" ? (
                    <div className="aspect-video">
                      <iframe
                        src={`https://player.vimeo.com/video/${tutor.demo_video_url?.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)?.[1]}?color=7C3AED&title=0&byline=0&portrait=0`}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; fullscreen; picture-in-picture"
                        title={tutor.demo_video_title || "Demo lesson"}
                      />
                    </div>
                  ) : null}
                </div>

                {(tutor.demo_video_title || tutor.demo_video_duration) && (
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    {tutor.demo_video_title && <span className="text-[15px] font-medium text-foreground">{tutor.demo_video_title}</span>}
                    {tutor.demo_video_duration && (
                      <Badge variant="secondary" className="text-xs">🕐 {tutor.demo_video_duration}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {tutor.demo_video_type === "youtube" ? "▶ Hosted on YouTube" : tutor.demo_video_type === "vimeo" ? "▶ Hosted on Vimeo" : "Uploaded video"}
                    </span>
                  </div>
                )}

                {/* CTA box */}
                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                  <p className="text-sm font-medium text-foreground">Liked what you saw?</p>
                  <Button variant="outline" className="w-full" onClick={handleMessage}>
                    <MessageCircle className="w-4 h-4 mr-2" /> Message Tutor
                  </Button>
                  {tutor.live_demo_enabled && (
                    <Button className="w-full" onClick={() => setComingSoonOpen(true)}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Live Demo — {tutor.live_demo_price === 0 ? "Free" : tutor.live_demo_price ? `PKR ${tutor.live_demo_price.toLocaleString()}` : "Free"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Coming Soon Modal */}
        <Dialog open={comingSoonOpen} onOpenChange={setComingSoonOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" /> Coming Very Soon!
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Live demo booking is almost ready. For now, message the tutor directly to arrange a session at a time that works for both of you.
            </p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => setComingSoonOpen(false)}>Close</Button>
              <Button className="flex-1" onClick={() => { setComingSoonOpen(false); handleMessage(); }}>
                <MessageCircle className="w-4 h-4 mr-2" /> Message Tutor
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* SECTION 3 — Teaching Details */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <Card className="mt-4">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">What I Teach</h2>

              <p className="text-xs font-medium text-muted-foreground mb-2">Subjects</p>
              <div className="flex flex-wrap gap-2">
                {allSubjects.map((subject) => (
                  <Badge key={subject} className="bg-primary text-primary-foreground text-xs px-3 py-1">
                    {subject}
                  </Badge>
                ))}
              </div>

              {tutor.math_levels && tutor.math_levels.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Talking in Math — Levels I Cover
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(tutor.math_levels as string[]).map((level) => (
                      <Badge key={level} variant="outline" className="text-xs border-primary/40 text-primary px-3 py-1">
                        {level}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 italic">Level-based math — not grade-based</p>
                </div>
              )}

              <div className="mt-5 p-4 rounded-lg bg-primary/5 border border-primary/10 inline-flex items-baseline gap-1">
                <span className="text-xl font-bold text-primary">PKR {tutor.hourly_rate_pkr.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">/ hour</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Demo session rate may vary</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* SECTION 4 — Education & Experience */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="mt-4">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Background & Experience</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Education */}
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Education</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Degree</p>
                      <p className="text-sm font-medium text-foreground">{tutor.degree}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Institution</p>
                      <p className="text-sm font-medium text-foreground">{tutor.university}</p>
                    </div>
                  </div>
                  {tutor.school_of_teaching && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <School className="h-3.5 w-3.5 text-primary" />
                        <p className="text-xs text-muted-foreground">Current School</p>
                      </div>
                      <p className="text-sm font-medium text-foreground">{tutor.school_of_teaching}</p>
                    </div>
                  )}
                </div>

                {/* Experience */}
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Experience</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Teaching Experience</p>
                      <p className="text-sm font-medium text-foreground">
                        {tutor.years_of_experience ?? 0} year{(tutor.years_of_experience ?? 0) !== 1 ? "s" : ""} of teaching
                      </p>
                    </div>
                    {tutor.city && (
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-sm font-medium text-foreground flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> {tutor.city}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* SECTION 5 — Reviews */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
          <Card className="mt-4">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Student Reviews</h2>

              {reviews.length > 0 ? (
                <>
                  {/* Rating summary */}
                  <div className="flex flex-col sm:flex-row gap-6 mb-6 p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                        <span className="text-3xl font-bold text-foreground">{(tutor.average_rating ?? 0).toFixed(1)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Based on {tutor.total_reviews} reviews</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {ratingBreakdown().map(({ star, pct }) => (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-8 text-right text-muted-foreground">{star} ★</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-muted-foreground">{pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Individual reviews */}
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="flex gap-3 p-4 rounded-lg border border-border">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={review.student_avatar || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {review.student_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{review.student_name}</span>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <Star className="h-10 w-10 text-muted mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No reviews yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Be the first to book a session and leave a review!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* SECTION 6 — Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-background border-t border-border z-50 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <span className="text-sm font-bold text-primary whitespace-nowrap">
            PKR {tutor.hourly_rate_pkr.toLocaleString()}/hr
          </span>
          <Button variant="outline" className="flex-1 min-h-[44px] text-sm" onClick={handleMessage}>
            <MessageCircle className="mr-1.5 h-4 w-4" /> Message
          </Button>
          {tutor.demo_video_url ? (
            <Button className="flex-1 min-h-[44px] text-sm" onClick={() => document.getElementById("demo-video")?.scrollIntoView({ behavior: "smooth" })}>
              <Play className="mr-1.5 h-4 w-4" /> Watch Demo
            </Button>
          ) : (
            <Button className="flex-1 min-h-[44px] text-sm" onClick={() => setComingSoonOpen(true)}>
              Book Demo
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function TutorProfileSkeleton() {
  return (
    <DashboardLayout userType="student">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-8 w-40 mb-4" />
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-3 mt-4">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-36" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="mt-4">
            <CardContent className="p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
