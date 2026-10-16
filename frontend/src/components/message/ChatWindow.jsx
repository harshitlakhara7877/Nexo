import { useCallback, useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  Check,
  CheckCheck,
  ImageIcon,
  Info,
  LoaderCircle,
  MessageCircle,
  Mic,
  Phone,
  Send,
  Smile,
  Sticker,
  Video,
} from "lucide-react";

import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

import {
  deleteConversation,
  getMessages,
  reportUser,
  sendMessage,
} from "@/services/messageService";

import ChatDetails from "@/components/message/ChatDetails";
import ReportDialog from "@/components/message/ReportDialog";
import DeleteChatDialog from "@/components/message/DeleteChatDialog";
import EmojiPicker from "emoji-picker-react";
import socket from "@/services/socket";

const getId = (value) => String(value?._id ?? value ?? "");

const getName = (person) => person?.name || person?.username || "Nexo user";

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
    <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E8] font-semibold text-[#FF4D00]">
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
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [showDetails, setShowDetails] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const imageInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

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
        throw new Error(response?.message || "Unable to load messages.");
      }

      setMessages(response.messages || []);
      onConversationUpdated();
    } catch (err) {
      console.error("Load messages error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load messages.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedContact?._id, onConversationUpdated]);

  useEffect(() => {
    setMessages([]);
    setDraft("");
    setError("");
    setShowDetails(false);
    setShowReportDialog(false);
    setShowDeleteDialog(false);

    if (selectedContact?._id) {
      loadMessages();
    } else {
      setLoading(false);
    }
  }, [selectedContact?._id, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  // handle new message and notify other user in real time
  useEffect(() => {
  const handleNewMessage = ({ message }) => {
    // Ignore events that don't contain a message.
    if (!message) return;

    // Only append messages from the currently selected contact.
    if (
      String(getId(message.sender)) !==
      String(selectedContact?._id)
    ) {
      return;
    }

    setMessages((current) => {
      // Prevent the same message from appearing twice.
      const alreadyExists = current.some(
        (item) => String(item._id) === String(message._id)
      );

      if (alreadyExists) return current;

      return [...current, message];
    });
  };

  socket.on("message:new", handleNewMessage);

  return () => {
    socket.off("message:new", handleNewMessage);
  };
}, [selectedContact?._id]);


  const handleSend = async (event) => {
    event.preventDefault();

    const text = draft.trim();

    if (!text || !selectedContact?._id || sending || text.length > 2000) {
      return;
    }

    setSending(true);

    try {
      const response = await sendMessage(selectedContact._id, text);

      if (!response?.success || !response.data) {
        throw new Error(response?.message || "Unable to send message.");
      }

      setMessages((current) => [...current, response.data]);

      setDraft("");
      onConversationUpdated();
      textareaRef.current?.focus();
    } catch (err) {
      console.error("Send message error:", err);

      toast.error(
        err.response?.data?.message || err.message || "Unable to send message.",
      );
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
          type: audioBlob.type,
        });

        // TODO: Upload audioFile using your message service.
        console.log("Recorded audio:", audioFile);

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access failed:", error);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder?.state === "recording") {
      recorder.stop();
    }

    setIsRecording(false);
  };

  const handleDeleteChat = async () => {
    if (!selectedContact?._id || deleting) return;

    setDeleting(true);

    try {
      const response = await deleteConversation(selectedContact._id);

      if (!response?.success) {
        throw new Error(response?.message || "Unable to delete chat.");
      }

      setShowDeleteDialog(false);
      toast.success("Chat removed from your inbox");

      onConversationUpdated();
      onBack();
    } catch (err) {
      console.error("Delete conversation error:", err);

      toast.error(
        err.response?.data?.message || err.message || "Unable to delete chat.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleReport = async ({ reason, details }) => {
    if (!selectedContact?._id) return false;

    try {
      const response = await reportUser(selectedContact._id, {
        reason,
        details,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Unable to submit report.");
      }

      toast.success("Report submitted successfully");
      setShowReportDialog(false);

      return true;
    } catch (err) {
      console.error("Report user error:", err);

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to submit report.",
      );

      return false;
    }
  };

  return (
    <>
      <section
        className={`relative flex h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-white ${
          mobileChatOpen ? "flex" : "hidden md:flex"
        }`}
      >
        {/* Center chat column */}
        <div className="flex h-full  min-h-0 min-w-0 flex-1 flex-col">
          {selectedContact ? (
            <>
              {/* Chat header */}
              <header className="flex h-[78px] shrink-0 items-center gap-3 border-b border-[#E4E1DB] bg-white px-4 sm:px-6">
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

                  <p className="mt-1 truncate text-xs text-[#686A72]">
                    @{selectedContact.username}
                  </p>
                </div>

                {/* Header actions */}
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                  {/* <button
                    type="button"
                    onClick={() =>
                      toast.info("Voice calling isn't available yet.")
                    }
                    aria-label="Voice call"
                    title="Voice call"
                    className="flex size-9 items-center justify-center rounded-full text-[#1B1C20] transition hover:bg-[#F7F6F3] hover:text-[#FF4D00]"
                  >
                    <Phone size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toast.info("Video calling isn't available yet.")
                    }
                    aria-label="Video call"
                    title="Video call"
                    className="flex size-9 items-center justify-center rounded-full text-[#1B1C20] transition hover:bg-[#F7F6F3] hover:text-[#FF4D00]"
                  >
                    <Video size={21} />
                  </button> */}

                  <button
                    type="button"
                    onClick={() => setShowDetails((current) => !current)}
                    aria-label={
                      showDetails ? "Hide details" : "Conversation details"
                    }
                    aria-pressed={showDetails}
                    title="Conversation details"
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full transition`}
                  >
                    <Info
                      size={27}
                      strokeWidth={2.5}
                      fill={showDetails ? "gray" : "none"}
                      color={showDetails ? "white" : "currentColor"}
                      className="shrink-0"
                    />
                  </button>
                </div>
              </header>

              {/* Scrollable messages */}
              {/* flex h-[78px] shrink-0 items-center gap-3 border-b border-[#E4E1DB] bg-white px-4 sm:px-6 */}
              <div className="min-h-0 flex-1  overflow-y-auto bg-white px-4 py-5 sm:px-6">
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
                      <MessageCircle size={27} />
                    </span>

                    <h3 className="mt-4 text-base font-semibold text-[#1B1C20]">
                      Say hello to {getName(selectedContact)}
                    </h3>

                    <p className="mt-2 max-w-xs text-sm leading-6 text-[#686A72]">
                      Send a message to get started.
                    </p>
                  </div>
                ) : (
                  <div className="mx-auto flex max-w-4xl flex-col gap-3">
                    {messages.map((message) => {
                      const ownMessage =
                        getId(message.sender) === getId(user?._id);

                      return (
                        <div
                          key={message._id}
                          className={`flex ${
                            ownMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                              ownMessage
                                ? "rounded-br-md bg-[#FF4D00] text-white"
                                : "rounded-bl-md border border-[#E4E1DB] bg-[#F7F6F3] text-[#1B1C20]"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {message.message}
                            </p>

                            <div
                              className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${
                                ownMessage ? "text-white/75" : "text-[#85858D]"
                              }`}
                            >
                              <span>{formatTime(message.createdAt)}</span>

                              {ownMessage &&
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
                className="shrink-0 relative p-3 sm:px-5 sm:py-4"
              >
                <div className="mx-auto max-w-dvw flex  items-center gap-2 rounded-2xl border border-[#ff5601] bg-white p-2 transition">
                  {showEmojiPicker && (
                    <div>
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setDraft((prev) => prev + emojiData.emoji);
                          textareaRef.current?.focus();
                        }}
                        width={12}
                        height={12}
                      />
                    </div>
                  )}

                  {/* Emoji */}
                  <button
                    type="button"
                    aria-label="Choose emoji"
                    title="Emoji"
                    onClick={() => setShowEmojiPicker((previous) => !previous)}
                    className="shrink-0  text-[#1B1C20] hover:text-[#FF4D00]"
                  >
                    <Smile size={25} strokeWidth={1.8} />
                  </button>

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
                    className="max-h-32 min-h-10 flex-1 resize-y bg-transparent  px-2 py-3 text-[17px] leading-5 text-[#1B1C20] outline-none placeholder:text-[#242836]"
                  />

                  {draft.trim() ? (
                    <button
                      type="submit"
                      disabled={sending}
                      aria-label="Send message"
                      title="Send message"
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FF4D00] text-white transition hover:bg-[#E64400] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {sending ? (
                        <LoaderCircle size={18} className="animate-spin" />
                      ) : (
                        <Send size={17} />
                      )}
                    </button>
                  ) : (
                    <div className="flex shrink-0 items-center gap-5 px-4">

                      {/* Mike  */}
                      <button
                        type="button"
                        aria-label={
                          isRecording
                            ? "Stop recording"
                            : "Record voice message"
                        }
                        title={isRecording ? "Stop recording" : "Voice message"}
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`shrink-0 ${
                          isRecording ? "text-red-500" : "text-[#1B1C20]"
                        } hover:text-[#FF4D00]`}
                      >
                        <Mic size={25} strokeWidth={1.8}/>
                      </button>

                      {/* Image attachment */}
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];

                          if (file) {
                            setSelectedImage(file);
                          }

                          event.target.value = "";
                        }}
                      />

                      <button
                        type="button"
                        aria-label="Attach image"
                        title="Attach image"
                        onClick={() => imageInputRef.current?.click()}
                        className="text-[#1B1C20] hover:text-[#FF4D00]"
                      >
                        <ImageIcon size={25} strokeWidth={1.8} />
                      </button>

                      {/* Sticker / GIF */}
                      <button
                        type="button"
                        aria-label="Stickers and GIFs"
                        title="Stickers and GIFs"
                        onClick={() => {
                          // Open your sticker/GIF picker here.
                        }}
                        className="text-[#1B1C20] hover:text-[#FF4D00]"
                      >
                        <Sticker size={25} strokeWidth={1.8} />
                      </button>
                    </div>
                  )}
                </div>
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
                Choose a conversation or search for someone to start a private
                chat.
              </p>
            </div>
          )}
        </div>

        {/* Right-side details panel */}
        {selectedContact && showDetails && (
          <ChatDetails
            contact={selectedContact}
            onClose={() => setShowDetails(false)}
            onReport={() => setShowReportDialog(true)}
            onDelete={() => setShowDeleteDialog(true)}
          />
        )}
      </section>

      {/* Independent dialogs */}
      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        contact={selectedContact}
        onSubmit={handleReport}
      />

      <DeleteChatDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        contact={selectedContact}
        deleting={deleting}
        onConfirm={handleDeleteChat}
      />
    </>
  );
}
