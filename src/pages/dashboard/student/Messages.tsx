import { useState, useEffect, useRef } from "react";
import { Send, Search, MoreVertical, Phone, Video } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  subject: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isMe: boolean;
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      name: "Ali Khan",
      subject: "Mathematics",
      lastMessage: "Great job on today's session! Keep practicing those equations.",
      lastMessageTime: "2 min ago",
      unreadCount: 2,
      online: true,
    },
    {
      id: "2",
      name: "Sara Ahmed",
      subject: "Physics",
      lastMessage: "Don't forget to complete the homework before our next session.",
      lastMessageTime: "1 hour ago",
      unreadCount: 0,
      online: false,
    },
  ]);

  const [selectedConversation, setSelectedConversation] = useState<string | null>("1");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: "tutor1",
      content: "Hi! How are you doing with the quadratic equations we covered?",
      timestamp: "10:30 AM",
      isMe: false,
    },
    {
      id: "2",
      senderId: "me",
      content: "Hi! I'm doing okay, but I'm a bit confused about the discriminant.",
      timestamp: "10:32 AM",
      isMe: true,
    },
    {
      id: "3",
      senderId: "tutor1",
      content: "No problem! The discriminant (b² - 4ac) tells us about the nature of roots. If it's positive, we have 2 real roots. If zero, 1 root. If negative, no real roots.",
      timestamp: "10:35 AM",
      isMe: false,
    },
    {
      id: "4",
      senderId: "me",
      content: "That makes sense now! Thank you for explaining.",
      timestamp: "10:38 AM",
      isMe: true,
    },
    {
      id: "5",
      senderId: "tutor1",
      content: "Great job on today's session! Keep practicing those equations.",
      timestamp: "10:40 AM",
      isMe: false,
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: "me",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      isMe: true,
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout userType="student">
      <div className="h-[calc(100vh-12rem)]">
        <Card className="h-full">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
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
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-muted transition-colors text-left ${
                      selectedConversation === conv.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={conv.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {conv.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {conv.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{conv.name}</h4>
                        <span className="text-xs text-muted-foreground">{conv.lastMessageTime}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{conv.subject}</p>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            {selectedConv ? (
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <CardHeader className="border-b py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={selectedConv.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {selectedConv.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        {selectedConv.online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedConv.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedConv.online ? "Online" : "Offline"} • {selectedConv.subject}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Video className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            message.isMe
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
