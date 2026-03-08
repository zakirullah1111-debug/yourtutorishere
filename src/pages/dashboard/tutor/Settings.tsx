import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import {
  User,
  Bell,
  Shield,
  Camera,
  Save,
  GraduationCap,
  Loader2,
  Eye,
  EyeOff,
  CalendarDays,
} from "lucide-react";
import { DemoVideoSection } from "@/components/tutor/DemoVideoSection";
import { ScheduleTab } from "@/components/tutor/ScheduleTab";

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology",
  "English", "Urdu", "Computer Science", "History",
  "Geography", "Islamiat", "Pakistan Studies",
];

const LANGUAGES = ["Urdu", "English", "Punjabi", "Sindhi", "Pashto"];

const EDUCATION_LEVELS = ["Bachelor's", "Master's", "PhD", "Other"];

const MATH_LEVELS = [
  { key: "foundations", label: "Foundations" },
  { key: "pre-algebra", label: "Pre-Algebra" },
  { key: "algebra", label: "Algebra" },
  { key: "geometry-trigonometry", label: "Geometry & Trigonometry" },
  { key: "pre-calculus", label: "Pre-Calculus" },
  { key: "calculus-beyond", label: "Calculus & Beyond" },
];

const EXPERIENCE_OPTIONS = [
  { value: "0", label: "Less than 1 year" },
  { value: "1", label: "1-2 years" },
  { value: "3", label: "3-5 years" },
  { value: "5", label: "5-10 years" },
  { value: "10", label: "10+ years" },
];

export default function TutorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileLoading, setProfileLoading] = useState(false);
  const [teachingLoading, setTeachingLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Profile state
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cnic: "",
    city: "",
    country: "Pakistan",
    bio: "",
    avatarUrl: "",
  });

  // Teaching state
  const [teaching, setTeaching] = useState({
    schoolOfTeaching: "",
    educationLevel: "",
    university: "",
    yearsOfExperience: "",
    subjects: [] as string[],
    teachingMode: "online",
    languages: [] as string[],
    hourlyRate: "",
    teachesMathByLevel: false,
    mathLevels: [] as string[],
  });

  // Notification state
  const [notifications, setNotifications] = useState({
    emailNewBooking: true,
    emailSessionReminder: true,
    emailPayment: true,
    emailReview: true,
    pushNewBooking: true,
    pushSessionReminder: true,
    pushMessages: true,
  });

  // Demo video state
  const [demoVideoData, setDemoVideoData] = useState({
    demo_video_type: null as string | null,
    demo_video_url: null as string | null,
    demo_video_title: null as string | null,
    demo_video_thumbnail: null as string | null,
    demo_video_duration: null as string | null,
    live_demo_enabled: false,
    live_demo_price: null as number | null,
  });

  // Password state
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showCnic, setShowCnic] = useState(false);

  const {
    uploading,
    avatarUrl,
    setAvatarUrl,
    fileInputRef,
    handleFileSelect,
    triggerFileInput,
  } = useAvatarUpload({
    userId: user?.id || "",
    onSuccess: (url) => {
      setProfile((prev) => ({ ...prev, avatarUrl: url }));
    },
  });

  useEffect(() => {
    if (user) fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    setFetchingData(true);

    try {
      const [{ data: profileData }, { data: tutorData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("tutors").select("*").eq("user_id", user.id).single(),
      ]);

      if (profileData) {
        setProfile((prev) => ({
          ...prev,
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          city: profileData.city || "",
          avatarUrl: profileData.avatar_url || "",
        }));
        setAvatarUrl(profileData.avatar_url || null);
      }

      if (tutorData) {
        const allSubjects = [
          tutorData.primary_subject,
          tutorData.secondary_subject,
          ...(tutorData.additional_subjects || []),
        ].filter(Boolean) as string[];

        setProfile((prev) => ({
          ...prev,
          bio: tutorData.bio_summary || "",
          cnic: (tutorData as any).cnic || "",
          country: (tutorData as any).country || "Pakistan",
        }));

        setTeaching({
          schoolOfTeaching: (tutorData as any).school_of_teaching || "",
          educationLevel: tutorData.education_level || "",
          university: tutorData.university || "",
          yearsOfExperience: tutorData.years_of_experience?.toString() || "",
          subjects: allSubjects,
          teachingMode: (tutorData as any).teaching_mode || "online",
          languages: tutorData.languages || [],
          hourlyRate: tutorData.hourly_rate_pkr?.toString() || "",
          teachesMathByLevel: Array.isArray((tutorData as any).math_levels) && (tutorData as any).math_levels.length > 0,
          mathLevels: (tutorData as any).math_levels || [],
        });

        const notifPrefs = (tutorData as any).notification_preferences;
        if (notifPrefs && typeof notifPrefs === "object") {
          setNotifications((prev) => ({ ...prev, ...notifPrefs }));
        }

        setDemoVideoData({
          demo_video_type: (tutorData as any).demo_video_type || null,
          demo_video_url: (tutorData as any).demo_video_url || null,
          demo_video_title: (tutorData as any).demo_video_title || null,
          demo_video_thumbnail: (tutorData as any).demo_video_thumbnail || null,
          demo_video_duration: (tutorData as any).demo_video_duration || null,
          live_demo_enabled: (tutorData as any).live_demo_enabled || false,
          live_demo_price: (tutorData as any).live_demo_price || null,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setFetchingData(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;
    setProfileLoading(true);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone,
          city: profile.city,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      const { error: tutorError } = await supabase
        .from("tutors")
        .update({
          bio_summary: profile.bio,
          cnic: profile.cnic,
          country: profile.country,
        } as any)
        .eq("user_id", user.id);

      if (tutorError) throw tutorError;

      toast({ title: "Profile updated successfully" });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleTeachingSave = async () => {
    if (!user) return;
    setTeachingLoading(true);

    try {
      const { error } = await supabase
        .from("tutors")
        .update({
          primary_subject: teaching.subjects[0] || "",
          secondary_subject: teaching.subjects[1] || null,
          additional_subjects: teaching.subjects.slice(2),
          education_level: teaching.educationLevel,
          university: teaching.university,
          years_of_experience: parseInt(teaching.yearsOfExperience) || 0,
          hourly_rate_pkr: parseInt(teaching.hourlyRate) || 0,
          languages: teaching.languages,
          teaching_mode: teaching.teachingMode,
          school_of_teaching: teaching.schoolOfTeaching,
          math_levels: teaching.teachesMathByLevel ? teaching.mathLevels : null,
        } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({ title: "Teaching information updated successfully" });
    } catch (error) {
      console.error("Error saving teaching info:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setTeachingLoading(false);
    }
  };

  const handleNotificationsSave = async () => {
    if (!user) return;
    setNotifLoading(true);

    try {
      const { error } = await supabase
        .from("tutors")
        .update({
          notification_preferences: notifications,
        } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({ title: "Preferences saved" });
    } catch (error) {
      console.error("Error saving notifications:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setNotifLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    const errs: Record<string, string> = {};
    if (!passwords.current) errs.current = "Current password is required";
    if (!passwords.new) errs.new = "New password is required";
    else if (passwords.new.length < 8) errs.new = "Password must be at least 8 characters";
    if (!passwords.confirm) errs.confirm = "Please confirm your password";
    else if (passwords.new !== passwords.confirm) errs.confirm = "Passwords do not match";

    setPasswordErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setPasswordLoading(true);

    try {
      // Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: passwords.current,
      });

      if (signInError) {
        setPasswordErrors({ current: "Current password is incorrect" });
        setPasswordLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;

      setPasswords({ current: "", new: "", confirm: "" });
      setPasswordErrors({});
      toast({ title: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const toggleSubject = (subject: string) => {
    setTeaching((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const toggleLanguage = (lang: string) => {
    setTeaching((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const maskCnic = (cnic: string) => {
    if (!cnic || cnic.length < 5) return cnic;
    return cnic.slice(0, 1) + "****-*******-" + cnic.slice(-1);
  };

  const userInitials =
    (profile.firstName?.[0] || "") + (profile.lastName?.[0] || "");

  if (fetchingData) {
    return (
      <DashboardLayout userType="tutor">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="tutor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="teaching" className="gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Teaching</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* ═══════════ PROFILE TAB ═══════════ */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
                <CardDescription>Update your profile picture</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile.avatarUrl} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {userInitials || "T"}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={triggerFileInput}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={triggerFileInput} disabled={uploading}>
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                      <><Camera className="w-4 h-4 mr-2" /> Change Photo</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size 2MB</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your basic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} disabled />
                  <p className="text-xs text-muted-foreground">Contact support to change your email</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="03XX-XXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnic">CNIC / National ID</Label>
                    <div className="relative">
                      <Input
                        id="cnic"
                        value={showCnic ? profile.cnic : maskCnic(profile.cnic)}
                        onChange={(e) => setProfile({ ...profile, cnic: e.target.value })}
                        readOnly={!showCnic}
                        placeholder="XXXXX-XXXXXXX-X"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowCnic(!showCnic)}
                      >
                        {showCnic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      placeholder="Lahore"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={profile.country}
                      onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / About Me</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell students about yourself, your teaching style, and experience..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleProfileSave} disabled={profileLoading}>
                {profileLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* ═══════════ TEACHING TAB ═══════════ */}
          <TabsContent value="teaching" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>School & Education</CardTitle>
                <CardDescription>Your teaching institution and qualifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>School of Teaching</Label>
                  <Input
                    value={teaching.schoolOfTeaching}
                    onChange={(e) => setTeaching({ ...teaching, schoolOfTeaching: e.target.value })}
                    placeholder="Current or most recent school/institute"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Education Level</Label>
                    <Select
                      value={teaching.educationLevel}
                      onValueChange={(v) => setTeaching({ ...teaching, educationLevel: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Institution / University</Label>
                    <Input
                      value={teaching.university}
                      onChange={(e) => setTeaching({ ...teaching, university: e.target.value })}
                      placeholder="LUMS, NUST, etc."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Select
                    value={teaching.yearsOfExperience}
                    onValueChange={(v) => setTeaching({ ...teaching, yearsOfExperience: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Math by Level (Talking in Math) */}
            {teaching.subjects.includes("Mathematics") && (
              <Card>
                <CardHeader>
                  <CardTitle>Talking in Math</CardTitle>
                  <CardDescription>Offer level-based math tutoring</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Do you teach Math by Level?</Label>
                    <Switch
                      checked={teaching.teachesMathByLevel}
                      onCheckedChange={(checked) =>
                        setTeaching((prev) => ({ ...prev, teachesMathByLevel: checked, mathLevels: checked ? prev.mathLevels : [] }))
                      }
                    />
                  </div>
                  {teaching.teachesMathByLevel && (
                    <div className="space-y-2 pt-2">
                      {MATH_LEVELS.map((level) => (
                        <div key={level.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`settings-math-${level.key}`}
                            checked={teaching.mathLevels.includes(level.key)}
                            onCheckedChange={() => {
                              setTeaching((prev) => ({
                                ...prev,
                                mathLevels: prev.mathLevels.includes(level.key)
                                  ? prev.mathLevels.filter((l) => l !== level.key)
                                  : [...prev.mathLevels, level.key],
                              }));
                            }}
                          />
                          <label htmlFor={`settings-math-${level.key}`} className="text-sm font-medium cursor-pointer">
                            {level.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Subjects You Teach</CardTitle>
                <CardDescription>Click to add or remove subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((subject) => (
                    <Badge
                      key={subject}
                      variant={teaching.subjects.includes(subject) ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5 text-sm transition-colors"
                      onClick={() => toggleSubject(subject)}
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teaching Mode & Languages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Teaching Mode</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "online", label: "🌐 Online Only" },
                      { value: "in-person", label: "🏠 In-Person Only" },
                      { value: "both", label: "✅ Both" },
                    ].map((mode) => (
                      <Button
                        key={mode.value}
                        type="button"
                        variant={teaching.teachingMode === mode.value ? "default" : "outline"}
                        className="h-auto py-3"
                        onClick={() => setTeaching({ ...teaching, teachingMode: mode.value })}
                      >
                        {mode.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Languages of Instruction</Label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <Badge
                        key={lang}
                        variant={teaching.languages.includes(lang) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1.5 text-sm transition-colors"
                        onClick={() => toggleLanguage(lang)}
                      >
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hourly Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Rate (PKR per hour)</Label>
                  <Input
                    type="number"
                    value={teaching.hourlyRate}
                    onChange={(e) => setTeaching({ ...teaching, hourlyRate: e.target.value })}
                    placeholder="1500"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleTeachingSave} disabled={teachingLoading}>
                {teachingLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Teaching Info</>
                )}
              </Button>
            </div>

            {/* Demo Video Section */}
            {user && (
              <DemoVideoSection
                userId={user.id}
                initialData={{
                  demo_video_type: demoVideoData.demo_video_type,
                  demo_video_url: demoVideoData.demo_video_url,
                  demo_video_title: demoVideoData.demo_video_title,
                  demo_video_thumbnail: demoVideoData.demo_video_thumbnail,
                  demo_video_duration: demoVideoData.demo_video_duration,
                  live_demo_enabled: demoVideoData.live_demo_enabled,
                  live_demo_price: demoVideoData.live_demo_price,
                }}
              />
            )}
          </TabsContent>

          {/* ═══════════ NOTIFICATIONS TAB ═══════════ */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Choose what emails you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "emailNewBooking", label: "Email me when a student books a session" },
                  { key: "emailSessionReminder", label: "Email me for session reminders" },
                  { key: "emailPayment", label: "Email me for payment notifications" },
                  { key: "emailReview", label: "Email me when I receive a new review" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <Label htmlFor={item.key}>{item.label}</Label>
                    <Switch
                      id={item.key}
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, [item.key]: checked })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
                <CardDescription>Manage in-app notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "pushNewBooking", label: "Push notifications for new bookings" },
                  { key: "pushSessionReminder", label: "Push notifications for session reminders" },
                  { key: "pushMessages", label: "Push notifications for new messages" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <Label htmlFor={item.key}>{item.label}</Label>
                    <Switch
                      id={item.key}
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, [item.key]: checked })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleNotificationsSave} disabled={notifLoading}>
                {notifLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Notification Preferences</>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* ═══════════ SECURITY TAB ═══════════ */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password regularly for security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwords.current}
                    onChange={(e) => {
                      setPasswords({ ...passwords, current: e.target.value });
                      if (passwordErrors.current) {
                        setPasswordErrors((prev) => { const n = { ...prev }; delete n.current; return n; });
                      }
                    }}
                  />
                  {passwordErrors.current && (
                    <p className="text-sm text-destructive">{passwordErrors.current}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwords.new}
                    onChange={(e) => {
                      setPasswords({ ...passwords, new: e.target.value });
                      if (passwordErrors.new) {
                        setPasswordErrors((prev) => { const n = { ...prev }; delete n.new; return n; });
                      }
                    }}
                  />
                  {passwordErrors.new && (
                    <p className="text-sm text-destructive">{passwordErrors.new}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => {
                      setPasswords({ ...passwords, confirm: e.target.value });
                      if (passwordErrors.confirm) {
                        setPasswordErrors((prev) => { const n = { ...prev }; delete n.confirm; return n; });
                      }
                    }}
                  />
                  {passwordErrors.confirm && (
                    <p className="text-sm text-destructive">{passwordErrors.confirm}</p>
                  )}
                </div>
                <Button onClick={handlePasswordChange} disabled={passwordLoading}>
                  {passwordLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication — Hidden for now, can be re-enabled later */}
            {/* 
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Receive codes via SMS when signing in
                    </p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
              </CardContent>
            </Card>
            */}

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
