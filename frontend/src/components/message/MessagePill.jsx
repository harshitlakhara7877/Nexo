import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { getConversations } from "@/services/messageService";
import socket from "@/services/socket";
import { useAuth } from "@/context/AuthContext";

export default function MessagePill() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentSenders, setRecentSenders] = useState([]);

  const isMessagesPage = pathname === "/messages";

  const refreshConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getConversations();
      if (res?.success && Array.isArray(res.conversations)) {
        let totalUnread = 0;
        const senders = [];

        res.conversations.forEach((conv) => {
          const count = conv.unreadCount || 0;
          totalUnread += count;
          if (count > 0 && conv.participant && senders.length < 3) {
            senders.push(conv.participant);
          }
        });

        // If no unread senders, take the most recent participant
        if (senders.length === 0 && res.conversations[0]?.participant) {
          senders.push(res.conversations[0].participant);
        }

        setUnreadCount(totalUnread);
        setRecentSenders(senders);
      }
    } catch (err) {
      // Quietly fail
    }
  }, [user]);

  useEffect(() => {
    refreshConversations();

    const handleNewMessage = () => {
      refreshConversations();
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:read", handleNewMessage);
    socket.on("conversation:updated", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:read", handleNewMessage);
      socket.off("conversation:updated", handleNewMessage);
    };
  }, [refreshConversations]);

  // Don't render on messages page or if not logged in
  if (isMessagesPage || !user) return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/messages")}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full border border-[#E4E1DB] bg-white px-4 py-2.5 shadow-xl transition-all hover:scale-105 hover:shadow-2xl dark:border-[#262626] dark:bg-[#181818]"
      title="Open Messages"
    >
      {/* Senders avatars or icon */}
      <div className="flex items-center -space-x-2">
        {recentSenders.length > 0 ? (
          recentSenders.slice(0, 2).map((sender, idx) => (
            <div
              key={sender._id || idx}
              className="size-7 overflow-hidden rounded-full ring-2 ring-white dark:ring-[#181818] bg-[#FFF0E8] dark:bg-[#202020]"
            >
              {sender.profilePicture?.url ? (
                <img
                  src={sender.profilePicture.url}
                  alt={sender.username}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-[10px] font-bold text-[#FF4D00]">
                  {sender.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex size-7 items-center justify-center rounded-full bg-[#FFF0E8] text-[#FF4D00] dark:bg-[#202020]">
            <MessageCircle size={15} />
          </div>
        )}
      </div>

      <span className="text-xs font-semibold text-[#1B1C20] dark:text-white">
        Messages
      </span>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF4D00] px-1.5 text-[11px] font-bold text-white shadow-sm">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
