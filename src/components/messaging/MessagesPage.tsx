import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { useMessaging } from "@/hooks/useMessaging";

interface MessagesPageProps {
  userType: "student" | "tutor";
}

export function MessagesPage({ userType }: MessagesPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Auto-select conversation from URL param
  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (convId && conversations.length > 0) {
      const exists = conversations.find((c) => c.id === convId);
      if (exists) {
        selectConversation(convId);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, conversations, selectConversation, setSearchParams]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <DashboardLayout userType={userType}>
      <div className="h-[calc(100vh-12rem)]">
        <Card className="h-full">
          <div className="flex h-full">
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelect={selectConversation}
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
        </Card>
      </div>
    </DashboardLayout>
  );
}
