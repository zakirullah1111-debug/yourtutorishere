import { useState } from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RequestDemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutor: {
    user_id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export function RequestDemoModal({ open, onOpenChange, tutor }: RequestDemoModalProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const tutorName = `${tutor.first_name} ${tutor.last_name}`.trim();
  const initials = `${tutor.first_name?.[0] || ""}${tutor.last_name?.[0] || ""}`.toUpperCase();

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await supabase.functions.invoke("request-demo", {
        body: {
          tutor_id: tutor.user_id,
          message: message.trim() || undefined,
        },
      });

      if (res.error) {
        const errData = res.data;
        if (errData?.error === "duplicate_request") {
          toast({
            title: "Request already sent",
            description: errData.message || "You already have a pending or confirmed session with this tutor.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Failed to send request", description: "Please try again.", variant: "destructive" });
        }
        return;
      }

      if (res.data?.success) {
        setSent(true);
      } else if (res.data?.error === "duplicate_request") {
        toast({
          title: "Request already sent",
          description: res.data.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Failed to send request", description: "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      // Reset state on close
      setTimeout(() => {
        setMessage("");
        setSent(false);
        setSending(false);
      }, 200);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px]">
        {sent ? (
          <div className="flex flex-col items-center text-center py-4">
            <CheckCircle2 className="h-12 w-12 text-primary mb-3" />
            <DialogHeader>
              <DialogTitle>Request Sent!</DialogTitle>
              <DialogDescription>
                Your demo request has been sent to {tutorName}. You'll be notified when they respond.
              </DialogDescription>
            </DialogHeader>
            <Button className="mt-6 w-full" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request a Demo Session</DialogTitle>
              <DialogDescription>
                Send a free demo request to this tutor
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3 py-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={tutor.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-foreground">{tutorName}</span>
            </div>

            <Textarea
              placeholder="Add a message (optional) — e.g. what subject you need help with, preferred times..."
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>

            <Button className="w-full" onClick={handleSend} disabled={sending}>
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {sending ? "Sending..." : "Send Demo Request"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
