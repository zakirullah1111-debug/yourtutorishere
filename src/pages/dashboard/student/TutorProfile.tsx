import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, MapPin, GraduationCap, Globe, Home,
  CheckCircle2, MessageCircle, BookOpen, Clock, Languages,
  ChevronDown, ChevronUp, Video, Play, Calendar, Users,
  BadgeCheck, Zap, Award, Heart, Share2, Flag
} from "lucide-react";
import { RequestDemoModal } from "@/components/booking/RequestDemoModal";
import { EnrollCourseModal } from "@/components/enrollment/EnrollCourseModal";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useMessaging } from "@/hooks/useMessaging";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ─── types ──────────────────────────────────────────── */
interface TutorData {
  id: string; user_id: string; bio_summary: string | null;
  primary_subject: string; secondary_subject: string | null;
  additional_subjects: string[] | null; hourly_rate_pkr: number;
  years_of_experience: number | null; education_level: string;
  university: string; degree: string; school_of_teaching: string | null;
  teaching_mode: string | null; languages: string[] | null;
  average_rating: number | null; total_reviews: number | null;
  math_levels: string[] | null; verified: boolean | null;
  first_name: string; last_name: string; avatar_url: string | null;
  city: string | null; demo_video_type: string | null;
  demo_video_url: string | null; demo_video_title: string | null;
  demo_video_thumbnail: string | null; demo_video_duration: string | null;
  live_demo_enabled: boolean; live_demo_price: number | null;
  total_students_taught: number | null; total_hours_taught: number | null;
}

interface Review {
  id: string; rating: number; comment: string | null;
  created_at: string; student_name: string; student_avatar: string | null;
}

/* ─── component ───────────────────────────────────────── */
export default function TutorProfile() {
  const { tutorId }  = useParams<{ tutorId: string }>();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const { toast }    = useToast();
  const { getOrCreateConversation } = useMessaging("student");

  const [tutor,       setTutor]       = useState<TutorData | null>(null);
  const [reviews,     setReviews]     = useState<Review[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [signedUrl,   setSignedUrl]   = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [enrollOpen,  setEnrollOpen]  = useState(false);
  const [wishlisted,  setWishlisted]  = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  /* ── fetch ── */
  useEffect(() => { if (tutorId) fetchTutor(); }, [tutorId]);

  useEffect(() => {
    if (!tutor) return;
    document.title = `${tutor.first_name} ${tutor.last_name} – Studypulse`;
    return () => { document.title = "Studypulse"; };
  }, [tutor]);

  /* ── sticky CTA on scroll ── */
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (heroRef.current) obs.observe(heroRef.current);
    return () => obs.disconnect();
  }, [tutor]);

  const fetchTutor = async () => {
    setLoading(true); setError(null);
    try {
      const { data: td, error: te } = await supabase
        .from("tutors")
        .select("id,user_id,primary_subject,secondary_subject,additional_subjects,education_level,university,degree,years_of_experience,hourly_rate_pkr,bio_summary,languages,teaching_mode,school_of_teaching,math_levels,average_rating,total_reviews,total_students_taught,total_hours_taught,verified,profile_complete,demo_video_url,demo_video_type,demo_video_title,demo_video_thumbnail,demo_video_duration,live_demo_enabled,live_demo_price")
        .eq("id", tutorId!)
        .eq("verified", true)
        .eq("profile_complete", true)
        .maybeSingle();

      if (te) throw te;
      if (!td) { setError("This tutor profile is not available."); return; }

      const { data: pd } = await supabase
        .from("profiles")
        .select("first_name,last_name,avatar_url,city")
        .eq("user_id", td.user_id)
        .maybeSingle();

      setTutor({
        ...td,
        first_name: pd?.first_name || "",
        last_name:  pd?.last_name  || "",
        avatar_url: pd?.avatar_url || null,
        city:       pd?.city       || null,
        demo_video_type:      (td as any).demo_video_type      || null,
        demo_video_url:       (td as any).demo_video_url       || null,
        demo_video_title:     (td as any).demo_video_title     || null,
        demo_video_thumbnail: (td as any).demo_video_thumbnail || null,
        demo_video_duration:  (td as any).demo_video_duration  || null,
        live_demo_enabled:    (td as any).live_demo_enabled    || false,
        live_demo_price:      (td as any).live_demo_price      || null,
        total_students_taught:(td as any).total_students_taught|| null,
        total_hours_taught:   (td as any).total_hours_taught   || null,
      });

      /* reviews */
      const { data: rv } = await supabase
        .from("reviews")
        .select("id,rating,comment,created_at,student_id")
        .eq("tutor_id", tutorId!)
        .order("created_at", { ascending: false })
        .limit(12);

      if (rv?.length) {
        const sids = rv.map(r => r.student_id);
        const { data: students } = await supabase.from("students").select("id,user_id").in("id", sids);
        const uids = students?.map(s => s.user_id) || [];
        const { data: sprofs } = await supabase.from("profiles").select("user_id,first_name,avatar_url").in("user_id", uids);
        const smap = new Map<string, { name: string; avatar: string | null }>();
        students?.forEach(s => {
          const sp = sprofs?.find(p => p.user_id === s.user_id);
          smap.set(s.id, { name: sp?.first_name || "Student", avatar: sp?.avatar_url || null });
        });
        setReviews(rv.map(r => ({
          id: r.id, rating: r.rating, comment: r.comment,
          created_at: r.created_at,
          student_name:   smap.get(r.student_id)?.name   || "Student",
          student_avatar: smap.get(r.student_id)?.avatar || null,
        })));
      }
    } catch (e) {
      console.error(e); setError("Something went wrong.");
    } finally { setLoading(false); }
  };

  const handleMessage = async () => {
    if (!user || !tutor) return;
    try {
      await getOrCreateConversation(tutor.user_id);
      navigate("/dashboard/student/messages");
    } catch { toast({ title: "Error", description: "Could not start conversation.", variant: "destructive" }); }
  };

  const allSubjects = tutor
    ? [tutor.primary_subject, tutor.secondary_subject, ...(tutor.additional_subjects || [])].filter(Boolean)
    : [];

  const initials = tutor ? `${tutor.first_name[0] || ""}${tutor.last_name[0] || ""}`.toUpperCase() : "";

  const ratingBreakdown = () => {
    if (!reviews.length) return [];
    const counts = [0,0,0,0,0];
    reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++; });
    return [5,4,3,2,1].map(star => ({
      star, count: counts[star-1],
      pct: Math.round((counts[star-1] / reviews.length) * 100),
    }));
  };

  if (loading) return <ProfileSkeleton />;

  if (error || !tutor) return (
    <DashboardLayout userType="student">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg text-muted-foreground">{error || "Tutor not found."}</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/student/find-tutors")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Find Tutors
        </Button>
      </div>
    </DashboardLayout>
  );

  const demoPrice = tutor.live_demo_price === 0 || !tutor.live_demo_price
    ? "Free" : `PKR ${tutor.live_demo_price.toLocaleString()}`;

  return (
    <DashboardLayout userType="student">
      <div className="max-w-4xl mx-auto pb-32 sm:pb-8">

        {/* Back */}
        <Button variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        {/* ── HERO CARD ─────────────────────────────────── */}
        <motion.div ref={heroRef} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Gradient banner */}
            <div className="h-28 gradient-bg relative">
              <div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize:"30px 30px"}} />
              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => setWishlisted(!wishlisted)}
                  className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <Heart className={cn("w-4 h-4 text-white", wishlisted && "fill-white")} />
                </button>
                <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Share2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <div className="px-6 pb-6">
              {/* Avatar + name row */}
              <div className="flex flex-col sm:flex-row gap-4 sm:items-end -mt-12 mb-5">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-card shadow-xl">
                    <AvatarImage src={tutor.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl font-bold gradient-bg text-white">{initials}</AvatarFallback>
                  </Avatar>
                  {tutor.verified && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 gradient-bg rounded-full flex items-center justify-center border-2 border-card">
                      <BadgeCheck className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 sm:pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-foreground">{tutor.first_name} {tutor.last_name}</h1>
                    {tutor.verified && (
                      <Badge className="gradient-bg text-white border-0 text-[10px]">
                        <BadgeCheck className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{tutor.degree} · {tutor.university}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {(tutor.total_reviews ?? 0) > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={cn("w-4 h-4", s <= Math.round(tutor.average_rating || 0) ? "fill-amber-400 text-amber-400" : "text-muted")} />
                          ))}
                        </div>
                        <span className="font-semibold text-foreground">{(tutor.average_rating || 0).toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">({tutor.total_reviews} reviews)</span>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-xs">New Tutor</Badge>
                    )}
                    {tutor.city && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" /> {tutor.city}
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop CTAs */}
                <div className="hidden sm:flex gap-2.5 shrink-0 pb-1">
                  <Button variant="outline" onClick={handleMessage}>
                    <MessageCircle className="mr-2 h-4 w-4" /> Message
                  </Button>
                  {tutor.live_demo_enabled && (
                    <Button className="gradient-bg text-white border-0 shadow-md shadow-primary/25" onClick={() => setBookingOpen(true)}>
                      <Calendar className="mr-2 h-4 w-4" /> Book Demo · {demoPrice}
                    </Button>
                  )}
                  <Button onClick={() => setEnrollOpen(true)}>
                    <GraduationCap className="mr-2 h-4 w-4" /> Enroll Course
                  </Button>
                </div>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                {[
                  { icon: Clock,   value: `${tutor.years_of_experience || 0}y`,  label: "Experience" },
                  { icon: Users,   value: tutor.total_students_taught ? `${tutor.total_students_taught}+` : "—", label: "Students" },
                  { icon: BookOpen,value: tutor.total_hours_taught     ? `${tutor.total_hours_taught}h`   : "—", label: "Hours Taught" },
                  { icon: Award,   value: `PKR ${tutor.hourly_rate_pkr.toLocaleString()}`, label: "Per hour" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <s.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">{s.value}</div>
                      <div className="text-[11px] text-muted-foreground">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── ABOUT ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
          <div className="bg-card border border-border rounded-2xl p-6 mt-4">
            <h2 className="text-base font-bold text-foreground mb-3">About Me</h2>
            {tutor.bio_summary ? (
              <>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {!bioExpanded && tutor.bio_summary.length > 320
                    ? tutor.bio_summary.slice(0, 320) + "…"
                    : tutor.bio_summary}
                </p>
                {tutor.bio_summary.length > 320 && (
                  <button
                    className="mt-2 text-sm text-primary font-medium hover:underline flex items-center gap-1"
                    onClick={() => setBioExpanded(!bioExpanded)}
                  >
                    {bioExpanded ? "Show less" : "Read more"}
                    {bioExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">No bio added yet.</p>
            )}

            {/* Languages + mode badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {tutor.languages?.map(lang => (
                <Badge key={lang} variant="outline" className="text-xs border-primary/30 text-primary gap-1">
                  <Languages className="w-3 h-3" /> {lang}
                </Badge>
              ))}
              <Badge variant="secondary" className="text-xs gap-1">
                {tutor.teaching_mode === "online"    ? <><Globe className="w-3 h-3" /> Online</> :
                 tutor.teaching_mode === "in-person" ? <><Home className="w-3 h-3" /> In-Person</> :
                 <><CheckCircle2 className="w-3 h-3" /> Online & In-Person</>}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* ── DEMO VIDEO ───────────────────────────────── */}
        {tutor.demo_video_url && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}>
            <div className="bg-card border border-border rounded-2xl p-6 mt-4">
              <div className="flex items-center gap-2 mb-1">
                <Video className="w-4 h-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">Watch a Demo Lesson</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                See how {tutor.first_name} teaches — before you commit to anything.
              </p>

              <div className="rounded-xl overflow-hidden shadow-lg bg-muted aspect-video">
                {tutor.demo_video_type === "upload" ? (
                  signedUrl ? (
                    <video controls preload="metadata" playsInline poster={tutor.demo_video_thumbnail || undefined} className="w-full h-full">
                      <source src={signedUrl} />
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Button variant="ghost" onClick={async () => {
                        const { data } = await supabase.storage.from("demo-videos").createSignedUrl(tutor.demo_video_url!, 3600);
                        if (data?.signedUrl) setSignedUrl(data.signedUrl);
                      }}>
                        <Play className="w-8 h-8 mr-2" /> Load Video
                      </Button>
                    </div>
                  )
                ) : tutor.demo_video_type === "youtube" ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${tutor.demo_video_url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)?.[1]}?rel=0&modestbranding=1`}
                    className="w-full h-full" frameBorder="0" allowFullScreen
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title={tutor.demo_video_title || "Demo lesson"}
                  />
                ) : tutor.demo_video_type === "vimeo" ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${tutor.demo_video_url?.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)?.[1]}?color=7C3AED&title=0&byline=0&portrait=0`}
                    className="w-full h-full" frameBorder="0" allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture"
                    title={tutor.demo_video_title || "Demo lesson"}
                  />
                ) : null}
              </div>

              {(tutor.demo_video_title || tutor.demo_video_duration) && (
                <div className="flex items-center gap-2 mt-3">
                  {tutor.demo_video_title && <span className="text-sm font-medium text-foreground">{tutor.demo_video_title}</span>}
                  {tutor.demo_video_duration && <Badge variant="secondary" className="text-xs">🕐 {tutor.demo_video_duration}</Badge>}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── SUBJECTS ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.16 }}>
          <div className="bg-card border border-border rounded-2xl p-6 mt-4">
            <h2 className="text-base font-bold text-foreground mb-4">What I Teach</h2>
            <div className="flex flex-wrap gap-2">
              {allSubjects.map(s => (
                <span key={s as string} className="px-3 py-1.5 bg-primary/8 text-primary text-sm font-medium rounded-lg">
                  {s as string}
                </span>
              ))}
            </div>
            {tutor.math_levels?.length && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Math levels covered</p>
                <div className="flex flex-wrap gap-2">
                  {(tutor.math_levels as string[]).map(l => (
                    <Badge key={l} variant="outline" className="text-xs border-primary/30 text-primary">{l}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-5 flex items-baseline gap-1.5 p-4 bg-primary/5 border border-primary/15 rounded-xl w-fit">
              <span className="text-2xl font-bold text-primary">PKR {tutor.hourly_rate_pkr.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">/ hour</span>
            </div>
          </div>
        </motion.div>

        {/* ── BACKGROUND ───────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
          <div className="bg-card border border-border rounded-2xl p-6 mt-4">
            <h2 className="text-base font-bold text-foreground mb-4">Background & Experience</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Education</span>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Degree</p>
                    <p className="text-sm font-medium text-foreground">{tutor.degree}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">University</p>
                    <p className="text-sm font-medium text-foreground">{tutor.university}</p>
                  </div>
                  {tutor.school_of_teaching && (
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Currently at</p>
                      <p className="text-sm font-medium text-foreground">{tutor.school_of_teaching}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Experience</span>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Teaching since</p>
                    <p className="text-sm font-medium text-foreground">
                      {tutor.years_of_experience ?? 0} year{(tutor.years_of_experience ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {tutor.city && (
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Location</p>
                      <p className="text-sm font-medium text-foreground flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> {tutor.city}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── REVIEWS ───────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.24 }}>
          <div className="bg-card border border-border rounded-2xl p-6 mt-4">
            <h2 className="text-base font-bold text-foreground mb-4">Student Reviews</h2>

            {reviews.length > 0 ? (
              <>
                {/* Summary */}
                <div className="flex flex-col sm:flex-row gap-6 mb-6 p-5 bg-muted/40 border border-border rounded-xl">
                  <div className="text-center sm:text-left shrink-0">
                    <div className="text-5xl font-bold text-foreground leading-none">
                      {(tutor.average_rating || 0).toFixed(1)}
                    </div>
                    <div className="flex justify-center sm:justify-start gap-0.5 my-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={cn("w-4 h-4", s <= Math.round(tutor.average_rating || 0) ? "fill-amber-400 text-amber-400" : "text-muted")} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{tutor.total_reviews} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {ratingBreakdown().map(({ star, pct }) => (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-6 text-muted-foreground text-right">{star}★</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-muted-foreground">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review cards */}
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="flex gap-3 p-4 rounded-xl border border-border hover:border-primary/20 transition-colors">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={r.student_avatar || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                          {r.student_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-foreground">{r.student_name}</span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={cn("w-3 h-3", s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted")} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </span>
                        </div>
                        {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Star className="w-10 h-10 text-muted mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No reviews yet</p>
                <p className="text-xs text-muted-foreground mt-1">Be the first to book a session!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── REPORT ───────────────────────────────────── */}
        <div className="mt-4 text-center">
          <button className="text-xs text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1.5">
            <Flag className="w-3 h-3" /> Report this profile
          </button>
        </div>
      </div>

      {/* ── STICKY MOBILE CTA ─────────────────────────── */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 sm:hidden bg-background/97 backdrop-blur border-t border-border z-50 px-4 py-3 transition-transform duration-300",
        stickyVisible ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="flex items-center gap-2.5 max-w-4xl mx-auto">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Per hour</p>
            <p className="text-base font-bold text-primary">PKR {tutor.hourly_rate_pkr.toLocaleString()}</p>
          </div>
          <Button variant="outline" className="h-11" onClick={handleMessage}>
            <MessageCircle className="w-4 h-4 mr-1.5" /> Message
          </Button>
          {tutor.live_demo_enabled ? (
            <Button className="gradient-bg text-white border-0 h-11" onClick={() => setBookingOpen(true)}>
              <Zap className="w-4 h-4 mr-1.5 fill-white" /> Book Demo
            </Button>
          ) : (
            <Button className="gradient-bg text-white border-0 h-11" onClick={() => setEnrollOpen(true)}>
              <GraduationCap className="w-4 h-4 mr-1.5" /> Enroll
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      {tutor && (
        <RequestDemoModal
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          tutor={{ user_id: tutor.user_id, first_name: tutor.first_name, last_name: tutor.last_name, avatar_url: tutor.avatar_url }}
        />
      )}
      {enrollOpen && tutor && (
        <EnrollCourseModal
          open={enrollOpen}
          onOpenChange={setEnrollOpen}
          tutor={{ id: tutor.id, first_name: tutor.first_name, last_name: tutor.last_name, primary_subject: tutor.primary_subject, secondary_subject: tutor.secondary_subject, additional_subjects: tutor.additional_subjects }}
        />
      )}
    </DashboardLayout>
  );
}

/* ─── skeleton ────────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <DashboardLayout userType="student">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-8 w-24 mb-4" />
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <Skeleton className="h-28 w-full" />
          <div className="p-6">
            <div className="flex gap-4 -mt-12 mb-5">
              <Skeleton className="w-24 h-24 rounded-full border-4 border-card" />
              <div className="flex-1 space-y-2 pt-14">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 mt-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
