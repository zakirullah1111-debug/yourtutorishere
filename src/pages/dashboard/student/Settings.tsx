import { useState, useEffect } from "react";
import { User, Bell, Lock, Shield, Camera, Save, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    school: "",
    grade: "",
    avatarUrl: "",
  });

  const [notifications, setNotifications] = useState({
    sessionReminders: true,
    newMessages: true,
    paymentConfirmations: true,
    weeklyReports: false,
    platformUpdates: false,
    smsReminders: true,
    smsPayments: false,
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

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  useEffect(() => {
    if (avatarUrl) {
      setProfile((prev) => ({ ...prev, avatarUrl }));
    }
  }, [avatarUrl]);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Fetch student data
      const { data: studentData } = await supabase
        .from("students")
        .select("school_name, current_class")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile({
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          school: studentData?.school_name || "",
          grade: studentData?.current_class || "",
          avatarUrl: profileData.avatar_url || "",
        });
        setAvatarUrl(profileData.avatar_url || null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update students table
      const { error: studentError } = await supabase
        .from("students")
        .update({
          school_name: profile.school,
          current_class: profile.grade,
        })
        .eq("user_id", user.id);

      if (studentError) throw studentError;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    toast({
      title: "Preferences Saved",
      description: "Your notification preferences have been updated.",
    });
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast({
        title: "Error",
        description: "Failed to send password reset email.",
        variant: "destructive",
      });
    }
  };

  const userInitials =
    (profile.firstName?.[0] || "").toUpperCase() +
    (profile.lastName?.[0] || "").toUpperCase();

  if (loading) {
    return (
      <DashboardLayout userType="student">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="student">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" /> Profile
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="w-4 h-4 mr-2" /> Security
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="w-4 h-4 mr-2" /> Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6 space-y-6">
            {/* Profile Photo */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
                <CardDescription>Update your profile picture</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profile.avatarUrl} />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {userInitials || "U"}
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
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button variant="outline" onClick={triggerFileInput} disabled={uploading}>
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      JPG, GIF or PNG. Max size of 2MB.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email} disabled />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+92 XXX XXXXXXX"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>School/College</Label>
                    <Input
                      value={profile.school}
                      onChange={(e) => setProfile({ ...profile, school: e.target.value })}
                      placeholder="Enter your school name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Grade/Class</Label>
                    <Select value={profile.grade} onValueChange={(v) => setProfile({ ...profile, grade: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="O-Level">O-Level</SelectItem>
                        <SelectItem value="A-Level">A-Level</SelectItem>
                        <SelectItem value="Matric">Matric</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="University">University</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Email Notifications</h4>
                  <div className="space-y-4">
                    {[
                      { key: "sessionReminders", label: "Session reminders (1 hour before)" },
                      { key: "newMessages", label: "New messages" },
                      { key: "paymentConfirmations", label: "Payment confirmations" },
                      { key: "weeklyReports", label: "Weekly progress reports" },
                      { key: "platformUpdates", label: "Platform updates" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <Label>{item.label}</Label>
                        <Switch
                          checked={notifications[item.key as keyof typeof notifications]}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, [item.key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4">SMS Notifications</h4>
                  <div className="space-y-4">
                    {[
                      { key: "smsReminders", label: "Session reminders" },
                      { key: "smsPayments", label: "Payment reminders" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <Label>{item.label}</Label>
                        <Switch
                          checked={notifications[item.key as keyof typeof notifications]}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, [item.key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSaveNotifications}>
                  <Save className="w-4 h-4 mr-2" /> Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Change Password</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      We'll send you an email with a link to reset your password.
                    </p>
                    <Button onClick={handleChangePassword}>Send Password Reset Email</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your privacy preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow tutors to see your profile
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Phone Number</Label>
                    <p className="text-sm text-muted-foreground">
                      Display phone number to assigned tutors
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Progress Sharing</Label>
                    <p className="text-sm text-muted-foreground">
                      Share progress with parents/guardians
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
