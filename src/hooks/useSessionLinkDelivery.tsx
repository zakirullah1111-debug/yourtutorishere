import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SessionLink {
  bookingId: string;
  meetingUrl: string;
  otherPersonName: string;
}

/**
 * On dashboard load + window focus, checks for confirmed bookings
 * where session time has arrived and sends the session link.
 * Returns active session links for the "Join Now" popup.
 */
export function useSessionLinkDelivery() {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<SessionLink | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const checkAndSendLinks = useCallback(async () => {
    if (!user) return;
    try {
      const res = await supabase.functions.invoke("send-session-link");
      if (res.data?.sent && res.data.sent.length > 0) {
        // Fetch the first sent booking to show popup
        const bookingId = res.data.sent[0];
        if (dismissed.has(bookingId)) return;

        const { data: booking } = await supabase
          .from("demo_bookings")
          .select("id, student_id, tutor_id, meeting_url")
          .eq("id", bookingId)
          .single();

        if (booking) {
          const otherUserId = booking.student_id === user.id ? booking.tutor_id : booking.student_id;
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("user_id", otherUserId)
            .single();

          setActiveSession({
            bookingId: booking.id,
            meetingUrl: booking.meeting_url,
            otherPersonName: profile ? `${profile.first_name} ${profile.last_name}`.trim() : "your tutor",
          });
        }
      }
    } catch (err) {
      console.error("Session link delivery check failed:", err);
    }
  }, [user, dismissed]);

  useEffect(() => {
    if (!user) return;
    checkAndSendLinks();
    const handleFocus = () => checkAndSendLinks();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user, checkAndSendLinks]);

  // Also listen for session_starting notifications via realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("session-link-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const notif = payload.new as any;
        if ((notif.type === "session_starting" || notif.type === "class_starting") && notif.action_url && !dismissed.has(notif.related_booking_id || notif.id)) {
          setActiveSession({
            bookingId: notif.related_booking_id || notif.id || "",
            meetingUrl: notif.action_url,
            otherPersonName: "",
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, dismissed]);

  const dismissPopup = useCallback(() => {
    if (activeSession) {
      setDismissed(prev => new Set(prev).add(activeSession.bookingId));
    }
    setActiveSession(null);
  }, [activeSession]);

  return { activeSession, dismissPopup };
}
