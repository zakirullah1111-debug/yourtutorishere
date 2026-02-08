import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  CreditCard,
  Camera,
  Save,
  GraduationCap,
  Clock,
  Loader2,
} from "lucide-react";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Urdu",
  "Computer Science",
  "Accounting",
];

const TEACHING_LEVELS = [
  "Primary (1-5)",
  "Middle (6-8)",
  "Matric (9-10)",
  "Intermediate (11-12)",
  "O-Levels",
  "A-Levels",
  "University",
];

export default function TutorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Profile state
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    bio: "",
    university: "",
    degree: "",
    graduationYear: "",
    hourlyRate: "",
    primarySubject: "",
    secondarySubject: "",
    teachingLevels: [] as string[],
    availabilityDays: [] as string[],
    preferredTimeSlot: "",
    avatarUrl: "",
  });

  const { 
    uploading, 
    avatarUrl, 
    setAvatarUrl, 
    fileInputRef, 
    handleFileSelect, 
    triggerFileInput 
  } = useAvatarUpload({
    userId: user?.id || "",
    onSuccess: (url) => {
      setProfile((prev) => ({ ...prev, avatarUrl: url }));
    },
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNewBooking: true,
    emailSessionReminder: true,
    emailPayment: true,
    emailReview: true,
    pushNewBooking: true,
    pushSessionReminder: true,
    pushMessages: true,
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    setFetchingData(true);

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Fetch tutor data
      const { data: tutorData } = await supabase
        .from("tutors")
        .select("*")
        .eq("user_id", user.id)
        .single();

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
        setProfile((prev) => ({
          ...prev,
          bio: tutorData.bio_summary || "",
          university: tutorData.university || "",
          degree: tutorData.degree || "",
          graduationYear: tutorData.graduation_year?.toString() || "",
          hourlyRate: tutorData.hourly_rate_pkr?.toString() || "",
          primarySubject: tutorData.primary_subject || "",
          secondarySubject: tutorData.secondary_subject || "",
          teachingLevels: tutorData.teaching_levels || [],
          availabilityDays: tutorData.availability_days || [],
          preferredTimeSlot: tutorData.preferred_time_slot || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setFetchingData(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Update profiles table
      await supabase
        .from("profiles")
        .update({
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone,
          city: profile.city,
        })
        .eq("user_id", user.id);

      // Update tutors table
      await supabase
        .from("tutors")
        .update({
          bio_summary: profile.bio,
          university: profile.university,
          degree: profile.degree,
          graduation_year: parseInt(profile.graduationYear),
          hourly_rate_pkr: parseInt(profile.hourlyRate),
          primary_subject: profile.primarySubject,
          secondary_subject: profile.secondarySubject,
          teaching_levels: profile.teachingLevels,
          availability_days: profile.availabilityDays,
          preferred_time_slot: profile.preferredTimeSlot,
        })
        .eq("user_id", user.id);

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTeachingLevel = (level: string) => {
    setProfile((prev) => ({
      ...prev,
      teachingLevels: prev.teachingLevels.includes(level)
        ? prev.teachingLevels.filter((l) => l !== level)
        : [...prev.teachingLevels, level],
    }));
  };

  const toggleAvailabilityDay = (day: string) => {
    setProfile((prev) => ({
      ...prev,
      availabilityDays: prev.availabilityDays.includes(day)
        ? prev.availabilityDays.filter((d) => d !== day)
        : [...prev.availabilityDays, day],
    }));
  };

  const userInitials =
    profile.firstName?.[0]?.toUpperCase() + (profile.lastName?.[0]?.toUpperCase() || "");

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

          {/* Profile Tab */}
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
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" /> Change Photo
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, GIF or PNG. Max size 2MB
                  </p>
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
                      onChange={(e) =>
                        setProfile({ ...profile, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile({ ...profile, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} disabled />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+92 300 1234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      placeholder="Lahore"
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

            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
                <CardDescription>Your academic qualifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="university">University / Institution</Label>
                  <Input
                    id="university"
                    value={profile.university}
                    onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                    placeholder="LUMS, NUST, etc."
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="degree">Degree</Label>
                    <Input
                      id="degree"
                      value={profile.degree}
                      onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
                      placeholder="BSc Mathematics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="graduationYear">Graduation Year</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      value={profile.graduationYear}
                      onChange={(e) =>
                        setProfile({ ...profile, graduationYear: e.target.value })
                      }
                      placeholder="2022"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleProfileSave} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>

          {/* Teaching Tab */}
          <TabsContent value="teaching" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subjects & Expertise</CardTitle>
                <CardDescription>What subjects do you teach?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Subject</Label>
                    <Select
                      value={profile.primarySubject}
                      onValueChange={(value) =>
                        setProfile({ ...profile, primarySubject: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Subject</Label>
                    <Select
                      value={profile.secondarySubject}
                      onValueChange={(value) =>
                        setProfile({ ...profile, secondarySubject: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hourly Rate (PKR)</Label>
                  <Input
                    type="number"
                    value={profile.hourlyRate}
                    onChange={(e) => setProfile({ ...profile, hourlyRate: e.target.value })}
                    placeholder="1500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teaching Levels</CardTitle>
                <CardDescription>Which grade levels do you teach?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TEACHING_LEVELS.map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={level}
                        checked={profile.teachingLevels.includes(level)}
                        onCheckedChange={() => toggleTeachingLevel(level)}
                      />
                      <label htmlFor={level} className="text-sm">
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
                <CardDescription>Set your available days and preferred time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Available Days</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={profile.availabilityDays.includes(day)}
                          onCheckedChange={() => toggleAvailabilityDay(day)}
                        />
                        <label htmlFor={day} className="text-sm">
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Preferred Time Slot</Label>
                  <Select
                    value={profile.preferredTimeSlot}
                    onValueChange={(value) =>
                      setProfile({ ...profile, preferredTimeSlot: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (2 PM - 5 PM)</SelectItem>
                      <SelectItem value="evening">Evening (5 PM - 9 PM)</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleProfileSave} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Choose what emails you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "emailNewBooking", label: "New session bookings" },
                  { key: "emailSessionReminder", label: "Session reminders" },
                  { key: "emailPayment", label: "Payment notifications" },
                  { key: "emailReview", label: "New reviews" },
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
                  { key: "pushNewBooking", label: "New bookings" },
                  { key: "pushSessionReminder", label: "Session starting soon" },
                  { key: "pushMessages", label: "New messages" },
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
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password regularly for security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button>Update Password</Button>
              </CardContent>
            </Card>

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
