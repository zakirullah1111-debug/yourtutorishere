import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, MapPin, GraduationCap, Globe, Home,
  CheckCircle2, MessageCircle, Clock, Languages, BadgeCheck,
  ChevronDown, ChevronUp, Video, Play, Calendar, Users,
  Award, Zap, Lock
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface TutorData {
  id: string; user_id: string; bio_summary: string | null;
  primary_subject: string; secondary_subject: string | null;
  additional_subjects: string[] | null; hourly_rate_pkr: number;
  years_of_experience: number | null; education_level: string;
  university: string; degree: string;
  teaching_mode: string | null; languages: string[] | null;
  average_rating: number | null; total_reviews: number | null;
  verified: boolean | null;
  first_name: string; last_name: string; avatar_url: string | null;
  city: string | null;
  demo_video_type: string | null; demo_video_url: string | null;
  demo_video_title: string | null; demo_video_duration: string | null;
  total_students_taught: number | null; total_hours_taught: number | null;
}

interface Review {
  id: string; rating: number; comment: string | null;
  created_at: string; student_name: string;
}

export default function PublicTutorProfile() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const [tutor,       setTutor]       = useState<TutorData | null>(null);
  const [reviews,     setReviews]     = useState<Review[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [signedUrl,   setSignedUrl]   = useState<string | null>(null);

  useEffect(() => { if (tutorId) fetchTutor(); }, [tutorId]);

  useEffect(() => {
    if (tutor) document.title = `${tutor.first_name} ${tutor.last_name} – Studypulse`;
    return () => { document.title = "Studypulse"; };
  }, [tutor]);

  // If user is logged in as student, redirect to dashboard profile
  useEffect(() => {
    if (user && tutorId) navigate(`/dashboard/student/tutor/${tutorId}`, { replace: true });
  }, [user, tutorId]);

  const fetchTutor = async () => {
    setLoading(true); setError(null);
    try {
      const { data: td, error: te } = await supabase
        .from("tutors")
        .select("id,user_id,primary_subject,secondary_subject,additional_subjects,education_level,university,degree,years_of_experience,hourly_rate_pkr,bio_summary,languages,teaching_mode,average_rating,total_reviews,total_students_taught,total_hours_taught,verified,profile_complete,demo_video_url,demo_video_type,demo_video_title,demo_video_duration")
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
        demo_video_type:     (td as any).demo_video_type  || null,
        demo_video_url:      (td as any).demo_video_url   || null,
        demo_video_title:    (td as any).demo_video_title || null,
        demo_video_duration: (td as any).demo_video_duration || null,
        total_students_taught: (td as any).total_students_taught || null,
        total_hours_taught:    (td as any).total_hours_taught    || null,
      });

      // Fetch up to 3 reviews publicly
      const { data: rv } = await supabase
        .from("reviews")
        .select("id,rating,comment,created_at,student_id")
        .eq("tutor_id", tutorId!)
        .order("created_at", { ascending: false })
        .limit(3);

      if (rv?.length) {
        const sids = rv.map(r => r.student_id);
        const { data: students } = await supabase.from("students").select("id,user_id").in("id", sids);
        const uids = students?.map(s => s.user_id) || [];
        const { data: sp } = await supabase.from("profiles").select("user_id,first_name").in("user_id", uids);
        const smap = new Map<string, string>();
        students?.forEach(s => {
          const p = sp?.find(x => x.user_id === s.user_id);
          smap.set(s.id, p?.first_name || "Student");
        });
        setReviews(rv.map(r => ({
          id: r.id, rating: r.rating, comment: r.comment,
          created_at: r.created_at, student_name: smap.get(r.student_id) || "Student",
        })));
      }
    } catch (e) { console.error(e); setError("Something went wrong."); }
    finally     { setLoading(false); }
  };

  if (loading) return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen">
        <div className="container mx-auto container-padding max-w-4xl space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </main>
      <Footer />
    </>
  );

  if (error || !tutor) return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error || "Tutor not found."}</p>
          <Button variant="outline" onClick={() => navigate("/tutors")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Browse Tutors
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );

  const allSubjects = [tutor.primary_subject, tutor.secondary_subject, ...(tutor.additional_subjects || [])].filter(Boolean);
  const initials = `${tutor.first_name[0] || ""}${tutor.last_name[0] || ""}`.toUpperCase();

  return (
    <>
      <Header />
      <main className="pt-20 pb-20 bg-background min-h-screen">
        <div className="container mx-auto container-padding max-w-4xl">

          <Button variant="ghost" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/tutors")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> All Tutors
          </Button>

          {/* ── Hero ─────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="h-28 gradient-bg relative">
                <div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",backgroundSize:"30px 30px"}} />
              </div>
              <div className="px-6 pb-6">
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
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {(tutor.total_reviews ?? 0) > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={cn("w-4 h-4", s <= Math.round(tutor.average_rating || 0) ? "fill-amber-400 text-amber-400" : "text-muted")} />
                            ))}
                          </div>
                          <span className="font-semibold text-sm text-foreground">{(tutor.average_rating || 0).toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">({tutor.total_reviews} reviews)</span>
                        </div>
                      ) : <Badge variant="secondary" className="text-xs">New Tutor</Badge>}
                      {tutor.city && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" /> {tutor.city}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Desktop CTA */}
                  <div className="hidden sm:flex gap-2.5 shrink-0 pb-1">
                    <Button className="gradient-bg text-white border-0 shadow-md shadow-primary/25" asChild>
                      <Link to={`/signup?next=/tutors/${tutorId}`}>
                        <Calendar className="mr-2 h-4 w-4" /> Book Free Demo
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                  {[
                    { icon: Clock,    value: `${tutor.years_of_experience || 0}y`,  label: "Experience" },
                    { icon: Users,    value: tutor.total_students_taught ? `${tutor.total_students_taught}+` : "—", label: "Students" },
                    { icon: Award,    value: `PKR ${tutor.hourly_rate_pkr.toLocaleString()}`, label: "Per hour" },
                    { icon: GraduationCap, value: allSubjects.length.toString(), label: "Subjects" },
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

          {/* ── About ─────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
            <div className="bg-card border border-border rounded-2xl p-6 mt-4">
              <h2 className="text-base font-bold text-foreground mb-3">About Me</h2>
              {tutor.bio_summary ? (
                <>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {!bioExpanded && tutor.bio_summary.length > 320 ? tutor.bio_summary.slice(0, 320) + "…" : tutor.bio_summary}
                  </p>
                  {tutor.bio_summary.length > 320 && (
                    <button className="mt-2 text-sm text-primary font-medium hover:underline flex items-center gap-1" onClick={() => setBioExpanded(!bioExpanded)}>
                      {bioExpanded ? "Show less" : "Read more"}
                      {bioExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </>
              ) : <p className="text-sm text-muted-foreground italic">No bio added yet.</p>}

              <div className="flex flex-wrap gap-2 mt-4">
                {tutor.languages?.map(lang => (
                  <Badge key={lang} variant="outline" className="text-xs border-primary/30 text-primary gap-1">
                    <Languages className="w-3 h-3" /> {lang}
                  </Badge>
                ))}
                <Badge variant="secondary" className="text-xs gap-1">
                  {tutor.teaching_mode === "online" ? <><Globe className="w-3 h-3" /> Online</> :
                   tutor.teaching_mode === "in-person" ? <><Home className="w-3 h-3" /> In-Person</> :
                   <><CheckCircle2 className="w-3 h-3" /> Online & In-Person</>}
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* ── Demo video (public preview) ───────────────── */}
          {tutor.demo_video_url && tutor.demo_video_type !== "upload" && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}>
              <div className="bg-card border border-border rounded-2xl p-6 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-bold text-foreground">Demo Lesson</h2>
                  {tutor.demo_video_title && <span className="text-sm text-muted-foreground">— {tutor.demo_video_title}</span>}
                </div>
                <div className="rounded-xl overflow-hidden aspect-video bg-muted">
                  {tutor.demo_video_type === "youtube" ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${tutor.demo_video_url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)?.[1]}?rel=0&modestbranding=1`}
                      className="w-full h-full" frameBorder="0" allowFullScreen
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      title={tutor.demo_video_title || "Demo"}
                    />
                  ) : tutor.demo_video_type === "vimeo" ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${tutor.demo_video_url?.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)?.[1]}?color=7C3AED&title=0`}
                      className="w-full h-full" frameBorder="0" allowFullScreen
                      allow="autoplay; fullscreen; picture-in-picture"
                      title={tutor.demo_video_title || "Demo"}
                    />
                  ) : null}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Subjects ──────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.16 }}>
            <div className="bg-card border border-border rounded-2xl p-6 mt-4">
              <h2 className="text-base font-bold text-foreground mb-4">What I Teach</h2>
              <div className="flex flex-wrap gap-2">
                {allSubjects.map(s => (
                  <span key={s as string} className="px-3 py-1.5 bg-primary/8 text-primary text-sm font-medium rounded-lg">{s as string}</span>
                ))}
              </div>
              <div className="mt-4 flex items-baseline gap-1.5 p-4 bg-primary/5 border border-primary/15 rounded-xl w-fit">
                <span className="text-2xl font-bold text-primary">PKR {tutor.hourly_rate_pkr.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">/ hour</span>
              </div>
            </div>
          </motion.div>

          {/* ── Reviews (first 3 public) ───────────────────── */}
          {reviews.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
              <div className="bg-card border border-border rounded-2xl p-6 mt-4">
                <h2 className="text-base font-bold text-foreground mb-4">
                  Student Reviews
                  <span className="text-sm font-normal text-muted-foreground ml-2">({tutor.total_reviews} total)</span>
                </h2>
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="flex gap-3 p-4 rounded-xl border border-border">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                        {r.student_name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground">{r.student_name}</span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={cn("w-3 h-3", s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted")} />
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Locked reviews teaser */}
                {(tutor.total_reviews || 0) > 3 && (
                  <div className="mt-4 p-4 rounded-xl bg-muted/40 border border-dashed border-border text-center">
                    <Lock className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {(tutor.total_reviews || 0) - 3} more reviews visible after signing up
                    </p>
                    <Button size="sm" className="mt-3 gradient-bg text-white border-0" asChild>
                      <Link to="/signup">Sign up free to read all</Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Signup gate CTA ───────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.28 }}>
            <div className="mt-6 gradient-bg rounded-2xl p-7 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 70% 30%, white 1px, transparent 1px)",backgroundSize:"24px 24px"}} />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-white fill-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ready to book a free demo?</h3>
                <p className="text-white/80 text-sm mb-6 max-w-sm mx-auto">
                  Create your free account in 90 seconds and schedule your first session with {tutor.first_name} today.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button className="bg-white text-primary font-bold hover:bg-white/92 shadow-lg" asChild>
                    <Link to={`/signup?next=/tutors/${tutorId}`}>
                      Book Free Demo with {tutor.first_name}
                    </Link>
                  </Button>
                  <Button variant="outline" className="border-white/40 text-white bg-white/10 hover:bg-white/20" asChild>
                    <Link to="/login">Already have an account</Link>
                  </Button>
                </div>
                <p className="text-white/50 text-xs mt-3">No credit card · 3 free demos · Cancel anytime</p>
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-background/97 backdrop-blur border-t border-border z-50 px-4 py-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Per hour</p>
            <p className="text-base font-bold text-primary">PKR {tutor.hourly_rate_pkr.toLocaleString()}</p>
          </div>
          <Button className="gradient-bg text-white border-0 h-11 shadow-md shadow-primary/25" asChild>
            <Link to={`/signup?next=/tutors/${tutorId}`}>
              <Calendar className="w-4 h-4 mr-2" /> Book Free Demo
            </Link>
          </Button>
        </div>
      </div>

      <Footer />
    </>
  );
}
