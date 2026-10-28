import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { getUserByUsername } from "@/services/userService";

import ConversationList from "@/components/message/ConversationList";
import ChatWindow from "@/components/message/ChatWindow";
import socket from "@/services/socket";

export default function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedContact, setSelectedContact] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [inboxVersion, setInboxVersion] = useState(0);

  // Refresh the inbox when a message is sent or a chat is opened.
  const refreshInbox = useCallback(() => {
    setInboxVersion((version) => version + 1);
  }, []);
  
  // refreshes the convo list only when the message is from someone whose chat is not currently open
  useEffect(() => {
  const handleNewMessage = ({ message }) => {
    const senderId = String(
      message?.sender?._id ?? message?.sender ?? ""
    );

    const activeContactId = String(
      selectedContact?._id ?? ""
    );

    // ChatWindow handles messages for the open conversation.
    // Refresh the inbox for messages from other contacts.
    if (senderId !== activeContactId) {
      refreshInbox();
    }
  };

  socket.on("message:new", handleNewMessage);

  return () => {
    socket.off("message:new", handleNewMessage);
  };
}, [selectedContact?._id, refreshInbox]);

  const handleSelectContact = useCallback(
    (contact) => {
      if (!contact?._id || String(contact._id) === String(user?._id)) {
        return;
      }

      setSelectedContact(contact);
      setMobileChatOpen(true);

      setSearchParams({ user: contact.username }, { replace: true });
    },
    [user?._id, setSearchParams],
  );

  const handleBack = useCallback(() => {
    setSelectedContact(null);
    setMobileChatOpen(false);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // Support opening a chat through /messages?user=username.
  useEffect(() => {
    const username = searchParams.get("user");

    if (!username || !user?._id) return;

    let cancelled = false;

    const loadContact = async () => {
      try {
        const response = await getUserByUsername(username);
        const contact = response?.user;

        if (!response?.success || !contact) {
          throw new Error("User not found.");
        }

        if (String(contact._id) === String(user._id)) {
          setSearchParams({}, { replace: true });
          return;
        }

        if (!cancelled) {
          setSelectedContact(contact);
          setMobileChatOpen(true);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error.response?.data?.message ||
              error.message ||
              "Unable to open conversation.",
          );

          setSearchParams({}, { replace: true });
        }
      }
    };

    loadContact();

    return () => {
      cancelled = true;
    };
  }, [searchParams, user?._id, setSearchParams]);

  return (
    <main className="h-dvh w-full min-w-0 overflow-hidden bg-[#FAFAFA] dark:bg-black">
      <div className="flex h-full w-full min-w-0 overflow-hidden bg-white dark:bg-black">
        <ConversationList
          selectedContact={selectedContact}
          onSelectContact={handleSelectContact}
          mobileChatOpen={mobileChatOpen}
          refreshKey={inboxVersion}
        />

        <ChatWindow
          selectedContact={selectedContact}
          onBack={handleBack}
          mobileChatOpen={mobileChatOpen}
          onConversationUpdated={refreshInbox}
        />
      </div>
    </main>
  );
}
