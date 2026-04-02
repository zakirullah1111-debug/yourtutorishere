import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";

interface EnrollCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutor: {
    id: string;
    first_name: string;
    last_name: string;
    primary_subject: string;
    secondary_subject?: string | null;
    additional_subjects?: string[] | null;
  };
}

const EDUCATION_BOARDS = [
  "Federal Board (FBISE)",
  "Punjab Board",
  "Sindh Board",
  "KPK Board",
  "Balochistan Board",
  "AJK Board",
  "Cambridge (O-Level)",
  "Cambridge (A-Level)",
  "IB (International Baccalaureate)",
  "Aga Khan Board",
  "Other",
];

const CLASSES = [
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "O-Level (Grade 9)", "O-Level (Grade 10)", "O-Level (Grade 11)",
  "A-Level (AS)", "A-Level (A2)",
  "FSc / ICS / ICom (Part 1)", "FSc / ICS / ICom (Part 2)",
  "University / Bachelor's", "Other",
];

export function EnrollCourseModal({ open, onOpenChange, tutor }: EnrollCourseModalProps) {
  const { user } = useAuth();
  const [subject, setSubject] = useState(tutor.primary_subject);
  const [currentClass, setCurrentClass] = useState("");
  const [educationBoard, setEducationBoard] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const allSubjects = [
    tutor.primary_subject,
    tutor.secondary_subject,
    ...(tutor.additional_subjects || []),
  ].filter(Boolean) as string[];

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please log in first.");
      return;
    }
    if (!subject) {
      toast.error("Please select a subject.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("enrollment_requests" as any).insert({
        student_user_id: user.id,
        tutor_id: tutor.id,
        subject,
        current_class: currentClass || null,
        education_board: educationBoard || null,
        message: message.trim().slice(0, 500) || null,
      } as any);

      if (error) {
        if (error.code === "23505") {
          toast.error("You already have a pending enrollment with this tutor.");
        } else {
          throw error;
        }
        return;
      }

      toast.success(`Enrollment request sent to ${tutor.first_name}! You'll be notified when they respond.`);
      onOpenChange(false);
      setMessage("");
      setCurrentClass("");
      setEducationBoard("");
    } catch (err) {
      console.error("Enrollment error:", err);
      toast.error("Failed to send enrollment request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Enroll with {tutor.first_name} {tutor.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {allSubjects.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Class */}
          <div className="space-y-2">
            <Label>Current Class / Grade</Label>
            <Select value={currentClass} onValueChange={setCurrentClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select your class" />
              </SelectTrigger>
              <SelectContent>
                {CLASSES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Education Board */}
          <div className="space-y-2">
            <Label>Education Board</Label>
            <Select value={educationBoard} onValueChange={setEducationBoard}>
              <SelectTrigger>
                <SelectValue placeholder="Select board" />
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_BOARDS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message to Tutor (optional)</Label>
            <Textarea
              placeholder="Introduce yourself, mention your goals or any specific topics you need help with..."
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || !subject}
          >
            {submitting ? "Sending Request..." : "Send Enrollment Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
