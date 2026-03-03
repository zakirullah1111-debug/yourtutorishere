import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Conversation {
  id: string;
  student_user_id: string;
  tutor_user_id: string;
  last_message: string | null;
  last_message_at: string;
  student_unread_count: number;
  tutor_unread_count: number;
  created_at: string;
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_id: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  is_read: boolean;
  created_at: string;
}

export function useMessaging(userType: "student" | "tutor") {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`student_user_id.eq.${user.id},tutor_user_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get other user profiles
      const otherUserIds = data.map((c: any) =>
        c.student_user_id === user.id ? c.tutor_user_id : c.student_user_id
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, avatar_url")
        .in("user_id", otherUserIds);

      const enriched: Conversation[] = data.map((c: any) => {
        const otherId = c.student_user_id === user.id ? c.tutor_user_id : c.student_user_id;
        const profile = profiles?.find((p) => p.user_id === otherId);
        return {
          ...c,
          other_user_id: otherId,
          other_user_name: profile
            ? `${profile.first_name} ${profile.last_name}`.trim()
            : "Unknown",
          other_user_avatar: profile?.avatar_url || null,
        };
      });

      setConversations(enriched);

      // Calculate total unread
      const unreadField = userType === "student" ? "student_unread_count" : "tutor_unread_count";
      const total = enriched.reduce((sum, c) => sum + ((c as any)[unreadField] || 0), 0);
      setTotalUnread(total);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [user, userType]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data as Message[]) || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;
    try {
      // Mark all unread messages from other person as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      // Reset unread count
      const unreadField = userType === "student" ? "student_unread_count" : "tutor_unread_count";
      await supabase
        .from("conversations")
        .update({ [unreadField]: 0 })
        .eq("id", conversationId);

      // Update local state
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, [unreadField]: 0 } : c
        )
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  }, [user, userType]);

  // Send message
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string | null,
    fileUrl?: string | null,
    fileName?: string | null,
    fileType?: string | null
  ) => {
    if (!user) return false;
    setSending(true);
    try {
      const { error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          file_url: fileUrl || null,
          file_name: fileName || null,
          file_type: fileType || null,
        });

      if (msgError) throw msgError;

      // Update conversation
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) {
        const otherUnreadField = userType === "student" ? "tutor_unread_count" : "student_unread_count";
        
        // Get current count first
        const { data: currentConv } = await supabase
          .from("conversations")
          .select(otherUnreadField)
          .eq("id", conversationId)
          .single();

        const currentCount = (currentConv as any)?.[otherUnreadField] || 0;

        await supabase
          .from("conversations")
          .update({
            last_message: content || (fileName ? `📎 ${fileName}` : "File"),
            last_message_at: new Date().toISOString(),
            [otherUnreadField]: currentCount + 1,
          })
          .eq("id", conversationId);
      }

      return true;
    } catch (err) {
      console.error("Error sending message:", err);
      toast({ title: "Failed to send message", variant: "destructive" });
      return false;
    } finally {
      setSending(false);
    }
  }, [user, userType, conversations, toast]);

  // Upload file
  const uploadFile = useCallback(async (file: File): Promise<{ url: string; name: string; type: string } | null> => {
    if (!user) return null;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large. Maximum size is 10MB.", variant: "destructive" });
      return null;
    }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    try {
      const { error } = await supabase.storage
        .from("chat-files")
        .upload(path, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("chat-files")
        .getPublicUrl(path);

      const fileType = file.type.startsWith("image/") ? "image" : 
                       file.type === "application/pdf" ? "pdf" : "doc";

      return { url: urlData.publicUrl, name: file.name, type: fileType };
    } catch (err) {
      console.error("Error uploading file:", err);
      toast({ title: "File upload failed. Please try again.", variant: "destructive" });
      return null;
    }
  }, [user, toast]);

  // Create or get conversation
  const getOrCreateConversation = useCallback(async (tutorUserId: string): Promise<string | null> => {
    if (!user) return null;
    try {
      // Check existing
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("student_user_id", user.id)
        .eq("tutor_user_id", tutorUserId)
        .maybeSingle();

      if (existing) return existing.id;

      // Create new
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          student_user_id: user.id,
          tutor_user_id: tutorUserId,
        })
        .select("id")
        .single();

      if (error) throw error;
      return newConv.id;
    } catch (err) {
      console.error("Error creating conversation:", err);
      toast({ title: "Could not start conversation", variant: "destructive" });
      return null;
    }
  }, [user, toast]);

  // Select conversation
  const selectConversation = useCallback(async (conversationId: string) => {
    setActiveConversationId(conversationId);
    await fetchMessages(conversationId);
    await markAsRead(conversationId);
  }, [fetchMessages, markAsRead]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime: new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as Message;
          // If in active conversation, add message
          if (newMsg.conversation_id === activeConversationId) {
            setMessages((prev) => [...prev, newMsg]);
            // Auto mark as read if it's from the other person
            if (newMsg.sender_id !== user.id) {
              markAsRead(newMsg.conversation_id);
            }
          }
          // Refresh conversations list
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeConversationId, fetchConversations, markAsRead]);

  return {
    conversations,
    messages,
    activeConversationId,
    loading,
    messagesLoading,
    sending,
    totalUnread,
    sendMessage,
    selectConversation,
    setActiveConversationId,
    uploadFile,
    getOrCreateConversation,
    fetchConversations,
  };
}
