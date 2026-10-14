import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  CheckCheck,
  LoaderCircle,
  MessageCircle,
  MessageSquare,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import {
  getMessages,
  sendMessage,
} from "@/services/messageService";

const getId = (value) => String(value?._id ?? value ?? "");

const getName = (person) =>
  person?.name || person?.username || "Nexo user";

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
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

export default function ChatWindow({
  selectedContact,
  onBack,
  mobileChatOpen,
  onConversationUpdated,
}) {
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Fetch this chat's history and mark incoming messages read
  // through the existing getMessages backend endpoint.
  const loadMessages = useCallback(async () => {
    if (!selectedContact?._id) {
      setMessages([]);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getMessages(selectedContact._id);

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to load messages."
        );
      }

      setMessages(response.messages || []);

      // Refresh the inbox's preview and unread count.
      onConversationUpdated();
    } catch (err) {
      console.error("Load messages error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load messages."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedContact?._id, onConversationUpdated]);

  useEffect(() => {
    setMessages([]);
    setDraft("");
    setError("");

    if (selectedContact?._id) {
      loadMessages();
    } else {
      setLoading(false);
    }
  }, [selectedContact?._id, loadMessages]);

  // Keep the latest message visible.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  const handleSend = async (event) => {
    event.preventDefault();

    const text = draft.trim();

    if (
      !text ||
      !selectedContact?._id ||
      sending ||
      text.length > 2000
    ) {
      return;
    }

    setSending(true);

    try {
      const response = await sendMessage(
        selectedContact._id,
        text
      );

      if (!response?.success || !response.data) {
        throw new Error(
          response?.message || "Unable to send message."
        );
      }

      setMessages((current) => [
        ...current,
        response.data,
      ]);

      setDraft("");

      // Ask the inbox to refresh its conversation preview.
      onConversationUpdated();

      textareaRef.current?.focus();
    } catch (err) {
      console.error("Send message error:", err);

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      className={`h-full min-h-0 min-w-0 flex-1 flex-col bg-white ${
        mobileChatOpen ? "flex" : "hidden md:flex"
      }`}
    >
      {selectedContact ? (
        <>
          {/* Chat header */}
          <header className="flex shrink-0 items-center gap-3 border-b border-[#EEECE8] bg-white px-4 py-3 sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to conversations"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#686A72] transition hover:bg-[#F7F6F3] md:hidden"
            >
              <ArrowLeft size={19} />
            </button>

            <UserAvatar user={selectedContact} />

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-[#1B1C20]">
                {getName(selectedContact)}
              </h2>

              <p className="mt-0.5 truncate text-xs text-[#686A72]">
                @{selectedContact.username}
              </p>
            </div>
          </header>

          {/* Message history */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#FCFBF9] px-4 py-5 sm:px-6">
            {loading ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-[#686A72]">
                <LoaderCircle
                  size={18}
                  className="animate-spin text-[#FF4D00]"
                />
                Loading messages...
              </div>
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-sm text-[#686A72]">{error}</p>

                <button
                  type="button"
                  onClick={loadMessages}
                  className="mt-3 text-sm font-semibold text-[#FF4D00] hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-[#FFF0E8] text-[#FF4D00]">
                  <MessageSquare size={27} />
                </span>

                <h3 className="mt-4 text-base font-semibold text-[#1B1C20]">
                  Say hello to {getName(selectedContact)}
                </h3>

                <p className="mt-2 max-w-xs text-sm leading-6 text-[#686A72]">
                  Send a message to get started.
                </p>
              </div>
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col gap-3">
                {messages.map((message) => {
                  const isOwnMessage =
                    getId(message.sender) === getId(user?._id);

                  return (
                    <div
                      key={message._id}
                      className={`flex ${
                        isOwnMessage
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                          isOwnMessage
                            ? "rounded-br-md bg-[#FF4D00] text-white"
                            : "rounded-bl-md border border-[#E4E1DB] bg-white text-[#1B1C20]"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">
                          {message.message}
                        </p>

                        <div
                          className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${
                            isOwnMessage
                              ? "text-white/75"
                              : "text-[#85858D]"
                          }`}
                        >
                          <span>{formatTime(message.createdAt)}</span>

                          {isOwnMessage &&
                            (message.isRead ? (
                              <>
                                <CheckCheck size={13} />
                                <span>Seen</span>
                              </>
                            ) : (
                              <>
                                <Check size={12} />
                                <span>Sent</span>
                              </>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSend}
            className="shrink-0 border-t border-[#EEECE8] bg-white p-3 sm:px-5 sm:py-4"
          >
            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[#E4E1DB] bg-[#F7F6F3] p-2 transition focus-within:border-[#FF4D00]">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(event) =>
                  setDraft(event.target.value.slice(0, 2000))
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();

                    if (draft.trim() && !sending) {
                      handleSend(event);
                    }
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder={`Message ${selectedContact.username}...`}
                aria-label="Write a message"
                className="max-h-32 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-5 text-[#1B1C20] outline-none placeholder:text-[#9A9CA3]"
              />

              <button
                type="submit"
                disabled={!draft.trim() || sending}
                aria-label="Send message"
                title="Send message"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FF4D00] text-white transition hover:bg-[#E64400] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Send size={17} />
                )}
              </button>
            </div>

            <p className="mx-auto mt-2 max-w-3xl text-right text-[10px] text-[#9A9CA3]">
              Enter to send · Shift + Enter for a new line
            </p>
          </form>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
          <span className="flex size-20 items-center justify-center rounded-3xl bg-[#FFF0E8] text-[#FF4D00]">
            <MessageCircle size={33} strokeWidth={1.6} />
          </span>

          <h2 className="mt-5 text-xl font-semibold tracking-tight text-[#1B1C20]">
            Your conversations, together
          </h2>

          <p className="mt-2 max-w-sm text-sm leading-6 text-[#686A72]">
            Choose a conversation or search for someone to start a private chat.
          </p>
        </div>
      )}
    </section>
  );
}