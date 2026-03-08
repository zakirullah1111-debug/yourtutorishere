import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Marks past confirmed demo_bookings as 'completed'.
 * Runs once on mount and on window focus.
 */
export function useSessionCompletion() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const markCompleted = async () => {
      try {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS

        // Fetch confirmed bookings that are past their end_time
        const { data: pastBookings } = await supabase
          .from("demo_bookings")
          .select("id, scheduled_date, end_time")
          .eq("status", "confirmed")
          .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`);

        if (!pastBookings || pastBookings.length === 0) return;

        const toComplete = pastBookings.filter(b => {
          if (b.scheduled_date < todayStr) return true;
          if (b.scheduled_date === todayStr && b.end_time < currentTime) return true;
          return false;
        });

        if (toComplete.length === 0) return;

        for (const b of toComplete) {
          await supabase
            .from("demo_bookings")
            .update({ status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq("id", b.id);
        }
      } catch (err) {
        console.error("Session completion check failed:", err);
      }
    };

    markCompleted();

    const handleFocus = () => markCompleted();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user]);
}
