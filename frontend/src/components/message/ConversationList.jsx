import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Edit,
  LoaderCircle,
  MessageCircle,
  Search,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

import {
  getConversations,
  searchMessagePeople,
} from "@/services/messageService";


const getId = (value) => String(value?._id ?? value ?? "");

const getName = (person) =>
  person?.name || person?.username || "Nexo user";

const getLastMessagePreview = (message, currentUserId) => {
  if (!message) return "Start a conversation";

  const isOwnMessage =
    getId(message.sender) === getId(currentUserId);

  const isAttachment =
    message.type === "image" ||
    message.type === "voice" ||
    message.type === "sticker" ||
    Boolean(
      message.image?.url ||
      message.audio?.url ||
      message.sticker?.id
    );

  if (isAttachment) {
    return isOwnMessage
      ? "You: Sent an attachment"
      : `${getName(message.sender)} sent an attachment`;
  }

  return isOwnMessage
    ? `You: ${message.message}`
    : message.message || "Message";
};

const formatTime = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (!Number.isFinite(date.getTime())) return "";

  if (date.toDateString() === new Date().toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

function UserAvatar({ user }) {
  const name = getName(user);

  return (
    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E8] font-semibold text-[#FF4D00]">
      {user?.profilePicture?.url ? (
        <img
          src={user.profilePicture.url}
          alt=""
          className="size-full object-cover"
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}



export default function ConversationList({
  selectedContact,
  onSelectContact,
  mobileChatOpen,
  refreshKey,
}) {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [error, setError] = useState("");

  // Fetch the inbox independently of the parent.
  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getConversations();

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to load conversations."
        );
      }

      setConversations(response.conversations || []);
    } catch (err) {
      console.error("Load conversations error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load conversations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations, refreshKey]);


  // Debounced people search.
  useEffect(() => {
    const query = search.trim();

    if (query.length < 2) {
      setPeople([]);
      setLoadingPeople(false);
      return undefined;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setLoadingPeople(true);

      try {
        const response = await searchMessagePeople(query);

        if (!response?.success) {
          throw new Error(
            response?.message || "Unable to search people."
          );
        }

        if (!cancelled) {
          setPeople(
            (response.users || []).filter(
              (person) =>
                getId(person._id) !== getId(user?._id)
            )
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Search people error:", err);
          setPeople([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingPeople(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, user?._id]);

  // Filter existing conversations locally.
  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const person = conversation.participant;

      return (
        person?.username?.toLowerCase().includes(query) ||
        person?.name?.toLowerCase().includes(query) ||
        conversation.lastMessage?.message
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [conversations, search]);

  const selectContact = (person) => {
    setSearch("");
    setPeople([]);
    onSelectContact(person);
  };

  return (
    <aside
      className={`h-full min-h-0 w-full shrink-0 flex-col border-r border-[#E4E1DB] bg-white md:flex md:w-[340px] lg:w-[400px] ${
        mobileChatOpen ? "hidden" : "flex"
      }`}
    >
      {/* Header and search */}
      <header className="shrink-0 border-b border-[#EEECE8] px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#1B1C20]">
              {user?.username}
            </h1>
          </div>

          <span className="flex size-10 items-center justify-center rounded-xl  text-[#FF4D00]">
            <Edit size={20} />
          </span>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#E4E1DB] bg-[#F7F6F3] px-3 focus-within:border-[#FF4D00]">
          <Search size={17} className="shrink-0 text-[#85858D]" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search people or messages"
            aria-label="Search people or conversations"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[#1B1C20] outline-none placeholder:text-[#9A9CA3]"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="flex size-7 items-center justify-center rounded-full text-[#85858D] hover:bg-white hover:text-[#1B1C20]"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* People search */}
        {search.trim().length >= 2 && (
          <section className="border-b border-[#EEECE8] p-3">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-[#85858D]">
              People
            </p>

            {loadingPeople ? (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-[#686A72]">
                <LoaderCircle
                  size={16}
                  className="animate-spin text-[#FF4D00]"
                />
                Searching people...
              </div>
            ) : people.length > 0 ? (
              <div className="space-y-1">
                {people.map((person) => (
                  <button
                    type="button"
                    key={person._id}
                    onClick={() => selectContact(person)}
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-[#FFF7F2]"
                  >
                    <UserAvatar user={person} />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#1B1C20]">
                        {getName(person)}
                      </span>

                      <span className="mt-0.5 block truncate text-xs text-[#686A72]">
                        @{person.username}
                      </span>
                    </span>

                    <ArrowUpRight
                      size={16}
                      className="text-[#85858D]"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-3 py-3 text-xs text-[#85858D]">
                No matching people found.
              </p>
            )}
          </section>
        )}

        {/* Conversation list */}
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#85858D]">
            Conversations
          </h2>
          
        </div>

        {loading ? (
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex animate-pulse items-center gap-3"
              >
                <div className="size-11 rounded-full bg-[#EEECE8]" />

                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 rounded bg-[#EEECE8]" />
                  <div className="h-3 w-36 rounded bg-[#EEECE8]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="px-5 py-6">
            <p className="text-sm text-[#686A72]">{error}</p>

            <button
              type="button"
              onClick={loadConversations}
              className="mt-2 text-sm font-semibold text-[#FF4D00] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="space-y-1 px-2 pb-3">
            {filteredConversations.map((conversation) => {
              const person = conversation.participant;

              const isSelected =
                getId(person?._id) ===
                getId(selectedContact?._id);

              const lastMessage = conversation.lastMessage;

              return (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => selectContact(person)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                    isSelected
                      ? "bg-[#FFF0E8]"
                      : "hover:bg-[#F7F6F3]"
                  }`}
                >
                  <UserAvatar user={person} />

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[#1B1C20]">
                        {getName(person)}
                      </span>

                      <span className="shrink-0 text-[10px] text-[#85858D]">
                        {formatTime(
                          lastMessage?.createdAt ||
                            conversation.updatedAt
                        )}
                      </span>
                    </span>

                    <span className="mt-1 flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs text-[#686A72]">
                        {getLastMessagePreview(lastMessage, user?._id)}
                      </span>

                      {conversation.unreadCount > 0 && (
                        <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-[#FF4D00] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {conversation.unreadCount > 99
                            ? "99+"
                            : conversation.unreadCount}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-10 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#FFF0E8] text-[#FF4D00]">
              <Users size={21} />
            </span>

            <p className="mt-3 text-sm font-semibold text-[#1B1C20]">
              {search
                ? "No matching conversations"
                : "No conversations yet"}
            </p>

            <p className="mt-1 text-xs leading-5 text-[#85858D]">
              Search for someone above to start chatting.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}