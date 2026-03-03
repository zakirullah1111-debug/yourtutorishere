import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { Conversation } from "@/hooks/useMessaging";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  userType: "student" | "tutor";
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  if (diffHours < 7 * 24) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelect,
  loading,
  userType,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = conversations.filter((c) =>
    c.other_user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUnread = (c: Conversation) =>
    userType === "student" ? c.student_unread_count : c.tutor_unread_count;

  if (loading) {
    return (
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="p-2 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="p-6 text-center">
            {conversations.length === 0 ? (
              <>
                <p className="text-muted-foreground text-sm mb-4">
                  {userType === "student"
                    ? "No messages yet. Find a tutor and click Message to start chatting!"
                    : "No messages yet. Students will appear here once they reach out."}
                </p>
                {userType === "student" && (
                  <Button asChild size="sm">
                    <Link to="/dashboard/student/find-tutors">Find Tutors</Link>
                  </Button>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No conversations match your search.</p>
            )}
          </div>
        ) : (
          filtered.map((conv) => {
            const unread = getUnread(conv);
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-muted transition-colors text-left ${
                  activeConversationId === conv.id ? "bg-muted" : ""
                }`}
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={conv.other_user_avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(conv.other_user_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`truncate ${unread > 0 ? "font-bold" : "font-medium"}`}>
                      {conv.other_user_name}
                    </h4>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {conv.last_message || "No messages yet"}
                  </p>
                </div>
                {unread > 0 && (
                  <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full shrink-0">
                    {unread}
                  </span>
                )}
              </button>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}
