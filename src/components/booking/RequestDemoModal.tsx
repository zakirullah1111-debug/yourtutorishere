import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Send, CheckCircle2, Lock, Zap, ArrowRight } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
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

type ModalState = "form" | "success" | "limit_reached";

export function RequestDemoModal({ open, onOpenChange, tutor }: RequestDemoModalProps) {
  const { toast } = useToast();
  const [message,     setMessage]     = useState("");
  const [sending,     setSending]     = useState(false);
  const [modalState,  setModalState]  = useState<ModalState>("form");
  const [demosLeft,   setDemosLeft]   = useState<number | null>(null);

  const tutorName = `${tutor.first_name} ${tutor.last_name}`.trim();
  const initials  = `${tutor.first_name?.[0] || ""}${tutor.last_name?.[0] || ""}`.toUpperCase();

  const handleSend = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-demo", {
        body: { tutor_id: tutor.user_id, message: message.trim() || undefined },
      });

      const responseData = data || {};

      /* demo limit hit */
      if (responseData?.error === "demo_limit_reached") {
        setModalState("limit_reached");
        return;
      }

      /* duplicate request */
      if (responseData?.error === "duplicate_request") {
        toast({
          title: "Already requested",
          description: responseData.message || "You already have a pending or confirmed session with this tutor.",
          variant: "destructive",
        });
        return;
      }

      /* other errors */
      if (error) {
        let errMsg = "Please try again.";
        try {
          const ctx = await (error as any)?.context?.json?.();
          if (ctx?.error === "demo_limit_reached") { setModalState("limit_reached"); return; }
          if (ctx?.error === "duplicate_request")  {
            toast({ title: "Already requested", description: ctx.message, variant: "destructive" });
            return;
          }
          errMsg = ctx?.message || ctx?.error || errMsg;
        } catch {}
        toast({ title: "Failed to send request", description: errMsg, variant: "destructive" });
        return;
      }

      if (responseData?.success) {
        if (responseData.demos_remaining !== undefined) setDemosLeft(responseData.demos_remaining);
        setModalState("success");
      } else {
        toast({ title: "Failed to send request", description: responseData?.message || "Please try again.", variant: "destructive" });
      }
    } catch (err) {
      console.error("request-demo exception:", err);
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setTimeout(() => {
        setMessage("");
        setModalState("form");
        setSending(false);
        setDemosLeft(null);
      }, 200);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px]">

        {/* ── Success ───────────────────────────────────── */}
        {modalState === "success" && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <DialogHeader>
              <DialogTitle>Request Sent! 🎉</DialogTitle>
              <DialogDescription className="mt-2">
                Your demo request has been sent to <strong>{tutorName}</strong>.
                You'll get a notification once they respond.
              </DialogDescription>
            </DialogHeader>
            {demosLeft !== null && (
              <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium w-full ${
                demosLeft === 0
                  ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                  : "bg-primary/5 text-primary border border-primary/15"
              }`}>
                {demosLeft === 0
                  ? "⚠️ This was your last free demo. Consider enrolling in a course to continue."
                  : `✅ You have ${demosLeft} free demo${demosLeft > 1 ? "s" : ""} remaining.`}
              </div>
            )}
            <Button className="mt-5 w-full gradient-bg text-white border-0" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        )}

        {/* ── Demo limit reached ────────────────────────── */}
        {modalState === "limit_reached" && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/40 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogHeader>
              <DialogTitle>Free demos used up</DialogTitle>
              <DialogDescription className="mt-2">
                You've used all <strong>3 free demo sessions</strong>. To continue learning with{" "}
                <strong>{tutorName}</strong> (or any other tutor), enroll in a paid course.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 w-full p-4 gradient-bg rounded-2xl text-left">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-white fill-white" />
                <span className="text-sm font-bold text-white">Why enroll?</span>
              </div>
              <ul className="text-white/85 text-sm space-y-1.5">
                <li>✓ Unlimited sessions with your tutor</li>
                <li>✓ Structured curriculum & progress tracking</li>
                <li>✓ JazzCash · EasyPaisa · Card payments</li>
                <li>✓ Starting from PKR 500/hr</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2.5 mt-5 w-full">
              <Button
                className="w-full gradient-bg text-white border-0 shadow-md"
                onClick={() => handleClose(false)}
                asChild
              >
                <Link to="/dashboard/student/find-tutors">
                  Browse Tutors to Enroll <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => handleClose(false)}>
                Maybe later
              </Button>
            </div>
          </div>
        )}

        {/* ── Form ──────────────────────────────────────── */}
        {modalState === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Request a Free Demo</DialogTitle>
              <DialogDescription>
                Send a demo request to {tutorName}. They'll confirm a time with you.
              </DialogDescription>
            </DialogHeader>

            {/* Tutor row */}
            <div className="flex items-center gap-3 py-2 px-3 bg-muted/50 rounded-xl border border-border">
              <Avatar className="h-10 w-10">
                <AvatarImage src={tutor.avatar_url || undefined} />
                <AvatarFallback className="gradient-bg text-white text-sm font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground text-sm">{tutorName}</p>
                <p className="text-xs text-muted-foreground">Free 30-min demo session</p>
              </div>
            </div>

            {/* Free badge */}
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                This is a free demo — no payment required. Up to 3 demos total.
              </p>
            </div>

            <Textarea
              placeholder="Optional message — e.g. subject you need help with, your level (O-Level/A-Level), preferred timings..."
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right -mt-1">{message.length}/500</p>

            <Button
              className="w-full gradient-bg text-white border-0 shadow-md shadow-primary/25"
              onClick={handleSend}
              disabled={sending}
            >
              {sending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                : <><Send className="mr-2 h-4 w-4" /> Send Demo Request</>}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
