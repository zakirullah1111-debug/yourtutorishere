import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
import { Loader2, User, Briefcase, BookOpen, Globe, Home, CheckCircle } from "lucide-react";
import { DemoVideoSection } from "@/components/tutor/DemoVideoSection";

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

export default function CompleteProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    cnic: "",
    city: "",
    country: "Pakistan",
    schoolOfTeaching: "",
    educationLevel: "",
    university: "",
    yearsOfExperience: "",
    bio: "",
    subjects: [] as string[],
    teachingMode: "",
    languages: [] as string[],
    hourlyRate: "",
    teachesMathByLevel: false,
    mathLevels: [] as string[],
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleChip = (field: "subjects" | "languages" | "mathLevels", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v: string) => v !== value)
        : [...prev[field], value],
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const formatCNIC = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 13);
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (!form.cnic.trim()) newErrors.cnic = "CNIC is required";
    else if (form.cnic.replace(/\D/g, "").length !== 13) newErrors.cnic = "CNIC must be 13 digits";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.schoolOfTeaching.trim()) newErrors.schoolOfTeaching = "School of teaching is required";
    if (!form.educationLevel) newErrors.educationLevel = "Education level is required";
    if (!form.university.trim()) newErrors.university = "Institution is required";
    if (!form.yearsOfExperience) newErrors.yearsOfExperience = "Experience is required";
    if (!form.bio.trim()) newErrors.bio = "Bio is required";
    else if (form.bio.trim().length < 50) newErrors.bio = "Bio must be at least 50 characters";
    if (form.subjects.length === 0) newErrors.subjects = "Select at least 1 subject";
    if (!form.teachingMode) newErrors.teachingMode = "Teaching mode is required";
    if (form.languages.length === 0) newErrors.languages = "Select at least 1 language";
    if (!form.hourlyRate.trim()) newErrors.hourlyRate = "Hourly rate is required";
    else if (isNaN(Number(form.hourlyRate)) || Number(form.hourlyRate) <= 0) newErrors.hourlyRate = "Enter a valid rate";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;
    setLoading(true);

    try {
      const nameParts = form.fullName.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "";

      // Update profiles table
      await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: form.phone,
          city: form.city,
        })
        .eq("user_id", user.id);

      // Upsert tutors table
      const { error: tutorError } = await supabase
        .from("tutors")
        .upsert({
          user_id: user.id,
          primary_subject: form.subjects[0],
          secondary_subject: form.subjects[1] || null,
          additional_subjects: form.subjects.slice(2),
          education_level: form.educationLevel,
          university: form.university,
          degree: form.educationLevel,
          graduation_year: new Date().getFullYear(),
          hourly_rate_pkr: parseInt(form.hourlyRate),
          years_of_experience: parseInt(form.yearsOfExperience),
          bio_summary: form.bio,
          languages: form.languages,
          teaching_levels: ["Matric (9-10)"],
          teaching_mode: form.teachingMode,
          school_of_teaching: form.schoolOfTeaching,
          cnic: form.cnic,
          country: form.country,
          profile_complete: true,
          verified: true,
          status: "Active",
          math_levels: form.teachesMathByLevel ? form.mathLevels : null,
        } as any, { onConflict: "user_id" });

      if (tutorError) throw tutorError;

      toast({
        title: "Profile Complete! 🎉",
        description: "You are now visible to students.",
      });

      navigate("/dashboard/tutor");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-sm text-destructive mt-1">{errors[field]}</p> : null;

  return (
    <DashboardLayout userType="tutor">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground">Fill in all details to go live and start teaching</p>
        </div>

        {/* Section 1: Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="e.g. Dr. Sarah Ahmed"
              />
              <FieldError field="fullName" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="03XX-XXXXXXX"
                />
                <FieldError field="phone" />
              </div>
              <div className="space-y-2">
                <Label>CNIC / National ID *</Label>
                <Input
                  value={form.cnic}
                  onChange={(e) => updateField("cnic", formatCNIC(e.target.value))}
                  placeholder="XXXXX-XXXXXXX-X"
                />
                <FieldError field="cnic" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Lahore"
                />
                <FieldError field="city" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" /> Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current or Most Recent School/Institute where you teach *</Label>
              <Input
                value={form.schoolOfTeaching}
                onChange={(e) => updateField("schoolOfTeaching", e.target.value)}
                placeholder="e.g. Lahore Grammar School"
              />
              <FieldError field="schoolOfTeaching" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Education Level *</Label>
                <Select value={form.educationLevel} onValueChange={(v) => updateField("educationLevel", v)}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError field="educationLevel" />
              </div>
              <div className="space-y-2">
                <Label>Institution / University *</Label>
                <Input
                  value={form.university}
                  onChange={(e) => updateField("university", e.target.value)}
                  placeholder="LUMS, NUST, etc."
                />
                <FieldError field="university" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Years of Experience *</Label>
              <Select value={form.yearsOfExperience} onValueChange={(v) => updateField("yearsOfExperience", v)}>
                <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError field="yearsOfExperience" />
            </div>
            <div className="space-y-2">
              <Label>Bio / About Me * <span className="text-muted-foreground text-xs">(min 50 characters)</span></Label>
              <Textarea
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Tell students about your teaching style, experience, and approach..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">{form.bio.length}/50 characters minimum</p>
              <FieldError field="bio" />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Teaching Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Teaching Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subjects */}
            <div className="space-y-2">
              <Label>Subjects You Teach *</Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((subject) => (
                  <Badge
                    key={subject}
                    variant={form.subjects.includes(subject) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5 text-sm transition-colors"
                    onClick={() => toggleChip("subjects", subject)}
                  >
                    {subject}
                  </Badge>
                ))}
              </div>
              <FieldError field="subjects" />
            </div>

            {/* Teaching Mode */}
            <div className="space-y-2">
              <Label>Teaching Mode *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: "online", label: "🌐 Online Only" },
                  { value: "in-person", label: "🏠 In-Person Only" },
                  { value: "both", label: "✅ Both" },
                ].map((mode) => (
                  <Button
                    key={mode.value}
                    type="button"
                    variant={form.teachingMode === mode.value ? "default" : "outline"}
                    className="h-auto py-3"
                    onClick={() => updateField("teachingMode", mode.value)}
                  >
                    {mode.label}
                  </Button>
                ))}
              </div>
              <FieldError field="teachingMode" />
            </div>

            {/* Languages */}
            <div className="space-y-2">
              <Label>Languages of Instruction *</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <Badge
                    key={lang}
                    variant={form.languages.includes(lang) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5 text-sm transition-colors"
                    onClick={() => toggleChip("languages", lang)}
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
              <FieldError field="languages" />
            </div>

            {/* Math by Level (Talking in Math) */}
            {form.subjects.includes("Mathematics") && (
              <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Do you teach Math by Level? (Talking in Math)</Label>
                    <p className="text-xs text-muted-foreground mt-1">Select if you offer level-based math tutoring</p>
                  </div>
                  <Switch
                    checked={form.teachesMathByLevel}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, teachesMathByLevel: checked, mathLevels: checked ? prev.mathLevels : [] }))}
                  />
                </div>
                {form.teachesMathByLevel && (
                  <div className="space-y-2 pt-2">
                    {MATH_LEVELS.map((level) => (
                      <div key={level.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`math-${level.key}`}
                          checked={form.mathLevels.includes(level.key)}
                          onCheckedChange={() => toggleChip("mathLevels", level.key)}
                        />
                        <label htmlFor={`math-${level.key}`} className="text-sm font-medium cursor-pointer">
                          {level.label}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Hourly Rate */}
            <div className="space-y-2">
              <Label>Hourly Rate (PKR) *</Label>
              <Input
                type="number"
                value={form.hourlyRate}
                onChange={(e) => updateField("hourlyRate", e.target.value)}
                placeholder="e.g. 1500"
              />
              <p className="text-xs text-muted-foreground">Per hour rate in PKR</p>
              <FieldError field="hourlyRate" />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Demo Video (Optional) */}
        {user && (
          <DemoVideoSection
            userId={user.id}
            isOptional
            initialData={{
              demo_video_type: null,
              demo_video_url: null,
              demo_video_title: null,
              demo_video_thumbnail: null,
              demo_video_duration: null,
              live_demo_enabled: false,
              live_demo_price: null,
            }}
          />
        )}

        {/* Submit */}
        <Button
          className="w-full h-12 min-h-[48px] text-base"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><CheckCircle className="w-4 h-4 mr-2" /> Complete Profile & Go Live</>
          )}
        </Button>
      </div>
    </DashboardLayout>
  );
}
