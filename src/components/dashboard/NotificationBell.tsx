import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleClick = (n: Notification) => {
    if (!n.is_read) markAsRead(n.id);
    if (n.action_url) {
      navigate(n.action_url);
      setOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "demo_requested":
        return "📩";
      case "demo_approved":
        return "✅";
      case "request_sent":
        return "📤";
      case "demo_rejected":
        return "❌";
      case "session_starting":
        return "🎥";
      case "booking_cancelled":
        return "🚫";
      default:
        return "🔔";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1 px-2 text-primary"
              onClick={markAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors",
                  !n.is_read && "bg-primary/5"
                )}
              >
                <div className="flex gap-2.5">
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm leading-tight",
                        !n.is_read
                          ? "font-semibold text-foreground"
                          : "text-foreground/80"
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(parseISO(n.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
