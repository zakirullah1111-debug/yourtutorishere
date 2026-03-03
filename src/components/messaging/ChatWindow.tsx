import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, X, Download, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import type { Message, Conversation } from "@/hooks/useMessaging";

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  messagesLoading: boolean;
  sending: boolean;
  onSendMessage: (conversationId: string, content: string | null, fileUrl?: string | null, fileName?: string | null, fileType?: string | null) => Promise<boolean>;
  onUploadFile: (file: File) => Promise<{ url: string; name: string; type: string } | null>;
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// Group messages by date
function groupByDate(messages: Message[]): { date: string; messages: Message[] }[] {
  const groups: { date: string; messages: Message[] }[] = [];
  let currentDate = "";

  for (const msg of messages) {
    const msgDate = new Date(msg.created_at).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groups.push({ date: msg.created_at, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }

  return groups;
}

export function ChatWindow({
  conversation,
  messages,
  messagesLoading,
  sending,
  onSendMessage,
  onUploadFile,
}: ChatWindowProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFilePreview, setPendingFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!conversation) return;
    if (!newMessage.trim() && !pendingFile) return;

    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;

    if (pendingFile) {
      setUploading(true);
      const result = await onUploadFile(pendingFile);
      setUploading(false);
      if (!result) return;
      fileUrl = result.url;
      fileName = result.name;
      fileType = result.type;
    }

    const content = newMessage.trim() || null;
    const success = await onSendMessage(conversation.id, content, fileUrl, fileName, fileType);

    if (success) {
      setNewMessage("");
      setPendingFile(null);
      setPendingFilePreview(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      return; // Hook handles the toast
    }

    setPendingFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPendingFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPendingFilePreview(null);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3">
        <MessageSquare className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">Select a conversation to start chatting</p>
      </div>
    );
  }

  const messageGroups = groupByDate(messages);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="border-b py-4 px-6 flex items-center gap-3 shrink-0">
        <Avatar className="w-10 h-10">
          <AvatarImage src={conversation.other_user_avatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(conversation.other_user_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{conversation.other_user_name}</h3>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messagesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <Skeleton className="h-12 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Say hello! 👋 Start the conversation.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messageGroups.map((group) => (
              <div key={group.date}>
                <div className="flex justify-center my-4">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {formatDateLabel(group.date)}
                  </span>
                </div>
                {group.messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex mb-2 ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        }`}
                      >
                        {/* File content */}
                        {msg.file_url && msg.file_type === "image" && (
                          <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="block mb-1">
                            <img
                              src={msg.file_url}
                              alt={msg.file_name || "Image"}
                              className="max-w-[200px] rounded-lg"
                              loading="lazy"
                            />
                          </a>
                        )}
                        {msg.file_url && msg.file_type !== "image" && (
                          <a
                            href={msg.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded-lg mb-1 ${
                              isMe ? "bg-primary-foreground/10" : "bg-background"
                            }`}
                          >
                            <FileText className="w-5 h-5 shrink-0" />
                            <span className="text-sm truncate">{msg.file_name || "File"}</span>
                            <Download className="w-4 h-4 shrink-0 ml-auto" />
                          </a>
                        )}

                        {/* Text content */}
                        {msg.content && (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}

                        {/* Timestamp + read status */}
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : ""}`}>
                          <p className={`text-xs ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {formatMessageTime(msg.created_at)}
                          </p>
                          {isMe && (
                            <span className={`text-xs ${msg.is_read ? "text-primary-foreground" : "text-primary-foreground/50"}`}>
                              {msg.is_read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* File preview */}
      {pendingFile && (
        <div className="px-4 pt-2 flex items-center gap-2 border-t bg-muted/50">
          {pendingFilePreview ? (
            <img src={pendingFilePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="flex items-center gap-2 bg-background p-2 rounded-lg">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm truncate max-w-[200px]">{pendingFile.name}</span>
            </div>
          )}
          <button onClick={() => { setPendingFile(null); setPendingFilePreview(null); }}>
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t shrink-0">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onInput={handleTextareaInput}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
          <Button
            onClick={handleSend}
            disabled={(!newMessage.trim() && !pendingFile) || sending || uploading}
            className="shrink-0"
          >
            {sending || uploading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
