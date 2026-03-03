import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useUnreadMessages(userType: "student" | "tutor") {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      const field = userType === "student" ? "student_unread_count" : "tutor_unread_count";
      const filterField = userType === "student" ? "student_user_id" : "tutor_user_id";
      
      const { data } = await supabase
        .from("conversations")
        .select(field)
        .eq(filterField, user.id);

      if (data) {
        const total = data.reduce((sum, row) => sum + ((row as any)[field] || 0), 0);
        setCount(total);
      }
    };

    fetchCount();

    const channel = supabase
      .channel("unread-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userType]);

  // Update document title
  useEffect(() => {
    document.title = count > 0 ? `(${count}) YouT utor - Messages` : "YouT utor";
  }, [count]);

  return count;
}
