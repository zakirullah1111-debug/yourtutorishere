import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { useMessaging } from "@/hooks/useMessaging";
import { useIsMobile } from "@/hooks/use-mobile";

interface MessagesPageProps {
  userType: "student" | "tutor";
}

export function MessagesPage({ userType }: MessagesPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const {
    conversations,
    messages,
    activeConversationId,
    loading,
    messagesLoading,
    sending,
    sendMessage,
    selectConversation,
    uploadFile,
  } = useMessaging(userType);

  const handleSelectConversation = useCallback(
    (id: string) => {
      selectConversation(id);
      if (isMobile) setMobileView("chat");
    },
    [selectConversation, isMobile]
  );

  const handleBack = useCallback(() => {
    setMobileView("list");
  }, []);

  // Auto-select conversation from URL param
  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (convId && conversations.length > 0) {
      const exists = conversations.find((c) => c.id === convId);
      if (exists) {
        handleSelectConversation(convId);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, conversations, handleSelectConversation, setSearchParams]);

  // Handle Android back button
  useEffect(() => {
    if (!isMobile || mobileView !== "chat") return;
    const handler = (e: PopStateEvent) => {
      e.preventDefault();
      setMobileView("list");
      window.history.pushState(null, "", window.location.href);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [isMobile, mobileView]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <DashboardLayout userType={userType}>
      <div className="h-[calc(100dvh-12rem)] md:h-[calc(100vh-12rem)]">
        <Card className="h-full overflow-hidden">
          {isMobile ? (
            <div className="relative h-full">
              {/* Conversation List - mobile full width */}
              <div
                className="absolute inset-0 transition-transform duration-250 ease-in-out"
                style={{
                  transform: mobileView === "chat" ? "translateX(-100%)" : "translateX(0)",
                }}
              >
                <ConversationList
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  onSelect={handleSelectConversation}
                  loading={loading}
                  userType={userType}
                  isMobile
                />
              </div>
              {/* Chat Window - mobile full width */}
              <div
                className="absolute inset-0 transition-transform duration-250 ease-in-out"
                style={{
                  transform: mobileView === "chat" ? "translateX(0)" : "translateX(100%)",
                }}
              >
                <ChatWindow
                  conversation={activeConversation}
                  messages={messages}
                  messagesLoading={messagesLoading}
                  sending={sending}
                  onSendMessage={sendMessage}
                  onUploadFile={uploadFile}
                  isMobile
                  onBack={handleBack}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full">
              <ConversationList
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelect={handleSelectConversation}
                loading={loading}
                userType={userType}
              />
              <ChatWindow
                conversation={activeConversation}
                messages={messages}
                messagesLoading={messagesLoading}
                sending={sending}
                onSendMessage={sendMessage}
                onUploadFile={uploadFile}
              />
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
