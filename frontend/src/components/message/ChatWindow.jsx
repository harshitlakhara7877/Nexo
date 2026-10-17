import { useCallback, useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Info,
  LoaderCircle,
  MessageCircle,
  Mic,
  Send,
  Smile,
  Sticker,
  X,
} from "lucide-react";

import { toast } from "sonner";
import EmojiPicker from "emoji-picker-react";

import { useAuth } from "@/context/AuthContext";

import {
  deleteConversation,
  getMessages,
  markConversationRead,
  reportUser,
  sendMessage,
} from "@/services/messageService";

import ChatDetails from "@/components/message/ChatDetails";
import ReportDialog from "@/components/message/ReportDialog";
import DeleteChatDialog from "@/components/message/DeleteChatDialog";

import socket from "@/services/socket";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [selectedImagePreview, setSelectedImagePreview] = useState("");

  const [imageDialogUrl, setImageDialogUrl] = useState(null);

  const [isRecording, setIsRecording] = useState(false);

  const imageInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);

  // --------------------------------------------------
  // Load messages for the selected conversation.
  // --------------------------------------------------

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
      // Mark incoming messages as read.
      try {
        await markConversationRead(selectedContact._id);
      } catch (readError) {
        console.error("Mark messages read error:", readError);
      }

      const response = await getMessages(selectedContact._id);

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to load messages."
        );
      }

      setMessages(response.messages || []);
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

  // Reset conversation-specific UI when switching contacts.
  useEffect(() => {
    setMessages([]);
    setDraft("");
    setError("");
    setSelectedImage(null);
    setShowEmojiPicker(false);
    setImageDialogUrl(null);
    setShowDetails(false);
    setShowReportDialog(false);
    setShowDeleteDialog(false);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    if (selectedContact?._id) {
      loadMessages();
    } else {
      setLoading(false);
    }
  }, [selectedContact?._id, loadMessages]);

  // --------------------------------------------------
  // Create and clean up the local image preview URL.
  // --------------------------------------------------

  useEffect(() => {
    if (!selectedImage) {
      setSelectedImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(selectedImage);

    setSelectedImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedImage]);

  // --------------------------------------------------
  // Close the emoji picker when clicking outside it.
  // --------------------------------------------------

  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleOutsideClick = (event) => {
      const target = event.target;

      if (!(target instanceof Element)) return;

      if (
        emojiPickerRef.current?.contains(target) ||
        emojiButtonRef.current?.contains(target)
      ) {
        return;
      }

      setShowEmojiPicker(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showEmojiPicker]);

  // Scroll to the latest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  // --------------------------------------------------
  // Receive messages for the currently open chat.
  // --------------------------------------------------

  useEffect(() => {
    const handleNewMessage = async ({ message }) => {
      if (!message || !selectedContact?._id) return;

      if (
        getId(message.sender) !== getId(selectedContact._id)
      ) {
        return;
      }

      setMessages((currentMessages) => {
        const alreadyExists = currentMessages.some(
          (item) => getId(item._id) === getId(message._id)
        );

        if (alreadyExists) return currentMessages;

        return [...currentMessages, message];
      });

      try {
        await markConversationRead(selectedContact._id);
        onConversationUpdated();
      } catch (readError) {
        console.error("Unable to mark incoming messages as read:", readError);
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [selectedContact?._id, onConversationUpdated]);

  // --------------------------------------------------
  // Update Sent / Seen when the backend emits message:read.
  // --------------------------------------------------

  useEffect(() => {
    const handleMessagesRead = ({ messageIds, readAt }) => {
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return;
      }

      const readIds = new Set(messageIds.map(String));

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          readIds.has(getId(message._id))
            ? {
                ...message,
                isRead: true,
                readAt,
              }
            : message
        )
      );
    };

    socket.on("message:read", handleMessagesRead);

    return () => {
      socket.off("message:read", handleMessagesRead);
    };
  }, []);

  // --------------------------------------------------
  // Image selection and validation.
  // --------------------------------------------------

  const handleSelectImage = (event) => {
    const file = event.target.files?.[0];

    // Allow selecting the same file again later.
    event.target.value = "";

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }

    setSelectedImage(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // --------------------------------------------------
  // Send a text message or an image with an optional caption.
  // --------------------------------------------------

  const handleSend = async (event) => {
    event.preventDefault();

    const text = draft.trim();
    const image = selectedImage;

    if (
      (!text && !image) ||
      !selectedContact?._id ||
      sending ||
      text.length > 2000
    ) {
      return;
    }

    setSending(true);

    try {
      let payload = text;

      if (image) {
        const formData = new FormData();

        formData.append("image", image);

        if (text) {
          formData.append("message", text);
        }

        payload = formData;
      }

      const response = await sendMessage(
        selectedContact._id,
        payload
      );

      if (!response?.success || !response.data) {
        throw new Error(
          response?.message || "Unable to send message."
        );
      }

      setMessages((currentMessages) => {
        const alreadyExists = currentMessages.some(
          (item) => getId(item._id) === getId(response.data._id)
        );

        return alreadyExists
          ? currentMessages
          : [...currentMessages, response.data];
      });

      setDraft("");
      setSelectedImage(null);
      setShowEmojiPicker(false);

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      onConversationUpdated();
      textareaRef.current?.focus();
    } catch (err) {
      console.error("Send message error:", {
        status: err.response?.status,
        response: err.response?.data,
        error: err.message,
      });

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  };

  // --------------------------------------------------
  // Voice recording — the sending/upload path is not
  // implemented by this composer change.
  // --------------------------------------------------

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        toast.error("Voice recording is not supported by this browser.");
        return;
      }

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

        const audioFile = new File(
          [audioBlob],
          `voice-${Date.now()}.webm`,
          { type: audioBlob.type }
        );

        // Voice upload is a separate feature step.
        console.log("Recorded audio:", audioFile);

        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access failed:", error);
      toast.error("Could not access your microphone.");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder?.state === "recording") {
      recorder.stop();
    }

    setIsRecording(false);
  };

  // --------------------------------------------------
  // Delete conversation.
  // --------------------------------------------------

  const handleDeleteChat = async () => {
    if (!selectedContact?._id || deleting) return;

    setDeleting(true);

    try {
      const response = await deleteConversation(selectedContact._id);

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to delete chat."
        );
      }

      setShowDeleteDialog(false);
      toast.success("Chat removed from your inbox");

      onConversationUpdated();
      onBack();
    } catch (err) {
      console.error("Delete conversation error:", err);

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to delete chat."
      );
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------------------------------
  // Report user.
  // --------------------------------------------------

  const handleReport = async ({ reason, details }) => {
    if (!selectedContact?._id) return false;

    try {
      const response = await reportUser(selectedContact._id, {
        reason,
        details,
      });

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to submit report."
        );
      }

      toast.success("Report submitted successfully");
      setShowReportDialog(false);

      return true;
    } catch (err) {
      console.error("Report user error:", err);

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to submit report."
      );

      return false;
    }
  };

  // --------------------------------------------------
  // Chat UI.
  // --------------------------------------------------

  return (
    <>
      <section
        className={`relative flex h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-white ${
          mobileChatOpen ? "flex" : "hidden md:flex"
        }`}
      >
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
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

                <button
                  type="button"
                  onClick={() => setShowDetails((current) => !current)}
                  aria-label={
                    showDetails
                      ? "Hide details"
                      : "Conversation details"
                  }
                  aria-pressed={showDetails}
                  title="Conversation details"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#686A72] transition hover:bg-[#F7F6F3] hover:text-[#FF4D00]"
                >
                  <Info size={22} />
                </button>
              </header>

              {/* Messages */}
              <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-5 sm:px-6">
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
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
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
                  <div className="mx-auto flex max-w-4xl flex-col gap-4">
                    {messages.map((message) => {
                      const ownMessage =
                        getId(message.sender) === getId(user?._id);

                      const isImageMessage =
                        message.type === "image" ||
                        Boolean(message.image?.url);

                      return (
                        <div
                          key={message._id}
                          className={`flex ${
                            ownMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-3 sm:max-w-[75%] ${
                              ownMessage
                                ? "rounded-br-md bg-[#FF4D00] text-white"
                                : "rounded-bl-md border border-[#E4E1DB] bg-[#F7F6F3] text-[#1B1C20]"
                            }`}
                          >
                            {isImageMessage ? (
                              <div className="space-y-2">
                                {message.image?.url ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setImageDialogUrl(message.image.url)
                                    }
                                    aria-label="View image full size"
                                    className="block max-w-full cursor-zoom-in overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00]"
                                  >
                                    <img
                                      src={message.image.url}
                                      alt="Shared image"
                                      loading="lazy"
                                      className="max-h-80 max-w-full rounded-xl object-contain"
                                    />
                                  </button>
                                ) : (
                                  <p className="px-1 py-2 text-sm">
                                    Image unavailable
                                  </p>
                                )}

                                {message.message?.trim() && (
                                  <p className="whitespace-pre-wrap break-words px-1 text-sm leading-6">
                                    {message.message}
                                  </p>
                                )}
                              </div>
                            ) : message.type === "voice" && message.audio?.url ? (
                              <audio
                                controls
                                preload="metadata"
                                src={message.audio.url}
                                className="max-w-full"
                              />
                            ) : message.type === "sticker" ? (
                              <span className="block px-2 py-1 text-5xl">
                                {message.sticker?.emoji || "✨"}
                              </span>
                            ) : (
                              <p className="whitespace-pre-wrap break-words px-1 text-sm leading-6">
                                {message.message}
                              </p>
                            )}

                            <div
                              className={`mt-1.5 flex items-center justify-end gap-1.5 px-1 text-[10px] ${
                                ownMessage
                                  ? "text-white/75"
                                  : "text-[#85858D]"
                              }`}
                            >
                              <span>{formatTime(message.createdAt)}</span>

                              {ownMessage &&
                                (message.isRead ? (
                                  <CheckCheck size={13} />
                                ) : (
                                  <Check size={12} />
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
                className="shrink-0 px-3 pb-3 pt-2 sm:px-5 sm:pb-4"
              >
                <div className="relative mx-auto max-w-4xl rounded-[24px] border border-[#E4E1DB] bg-white shadow-sm transition focus-within:border-[#FF4D00] focus-within:ring-2 focus-within:ring-[#FF4D00]/10">
                  {/* Emoji picker: positioned above the input, not inside its row */}
                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute bottom-[calc(100%+12px)] left-2 z-50 overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white shadow-xl"
                    >
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setDraft((previous) =>
                            (previous + emojiData.emoji).slice(0, 2000)
                          );
                          setShowEmojiPicker(false);
                          textareaRef.current?.focus();
                        }}
                        width={320}
                        height={360}
                        previewConfig={{ showPreview: false }}
                      />
                    </div>
                  )}

                  {/* Selected image strip — inside the composer */}
                  {selectedImage && selectedImagePreview && (
                    <div className="flex items-start gap-3 border-b border-[#EEECE8] px-3 pb-3 pt-3 sm:px-4">
                      {/* Add / replace image button */}
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        aria-label="Add or replace image"
                        title="Add or replace image"
                        className="flex size-[76px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl bg-[#F0F1F2] text-[#686A72] transition hover:bg-[#FFF0E8] hover:text-[#FF4D00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00]"
                      >
                        <ImageIcon size={24} strokeWidth={1.8} />
                        <span className="text-[10px] font-medium">
                          Add image
                        </span>
                      </button>

                      {/* Selected image thumbnail and its own cross button */}
                      <div className="relative size-[76px] shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setImageDialogUrl(selectedImagePreview)
                          }
                          aria-label="Preview selected image"
                          className="size-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00]"
                        >
                          <img
                            src={selectedImagePreview}
                            alt="Selected image preview"
                            className="size-full rounded-xl border border-[#E4E1DB] object-cover"
                          />
                        </button>

                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={removeSelectedImage}
                          aria-label="Remove selected image"
                          title="Remove image"
                          className="absolute -right-2 -top-2 z-10 size-6 rounded-full border border-[#E4E1DB] bg-white p-0 text-[#1B1C20] shadow-md hover:bg-[#FFF0E8] hover:text-[#FF4D00]"
                        >
                          <X size={13} />
                        </Button>
                      </div>

                      <div className="min-w-0 flex-1 pt-1">
                        <p className="truncate text-sm font-semibold text-[#1B1C20]">
                          Image ready to send
                        </p>
                        <p className="mt-1 truncate text-xs text-[#686A72]">
                          {selectedImage.name}
                        </p>
                        <p className="mt-1 text-xs text-[#85858D]">
                          Add a caption below, or send it alone.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Text-entry row */}
                  <div className="flex items-end gap-2 p-2 sm:gap-3 sm:p-3">
                    <button
                      ref={emojiButtonRef}
                      type="button"
                      aria-label="Choose emoji"
                      title="Emoji"
                      aria-expanded={showEmojiPicker}
                      onClick={() =>
                        setShowEmojiPicker((previous) => !previous)
                      }
                      className={`mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full transition ${
                        showEmojiPicker
                          ? "bg-[#FFF0E8] text-[#FF4D00]"
                          : "text-[#686A72] hover:bg-[#F7F6F3] hover:text-[#FF4D00]"
                      }`}
                    >
                      <Smile size={24} strokeWidth={1.8} />
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

                          if (
                            (draft.trim() || selectedImage) &&
                            !sending
                          ) {
                            handleSend(event);
                          }
                        }

                        if (event.key === "Escape") {
                          setShowEmojiPicker(false);
                        }
                      }}
                      rows={1}
                      maxLength={2000}
                      placeholder={`Message ${selectedContact.username}...`}
                      aria-label="Write a message"
                      className="max-h-32 min-h-10 min-w-0 flex-1 resize-y bg-transparent px-1 py-3 text-sm leading-5 text-[#1B1C20] outline-none placeholder:text-[#9A9CA3]"
                    />

                    {/* Keep the image option available while typing */}
                    {!selectedImage && (
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleSelectImage}
                      />
                    )}

                    {selectedImage && (
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleSelectImage}
                      />
                    )}

                    {!selectedImage && (
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        aria-label="Attach image"
                        title="Attach image"
                        className="mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full text-[#686A72] transition hover:bg-[#FFF0E8] hover:text-[#FF4D00]"
                      >
                        <ImageIcon size={23} strokeWidth={1.8} />
                      </button>
                    )}

                    {draft.trim() || selectedImage ? (
                      <button
                        type="submit"
                        disabled={sending}
                        aria-label="Send message"
                        title="Send message"
                        className="mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FF4D00] text-white transition hover:bg-[#E64400] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sending ? (
                          <LoaderCircle size={18} className="animate-spin" />
                        ) : (
                          <Send size={17} />
                        )}
                      </button>
                    ) : (
                      <div className="mb-0.5 flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label={
                            isRecording
                              ? "Stop recording"
                              : "Record voice message"
                          }
                          title={
                            isRecording
                              ? "Stop recording"
                              : "Voice message"
                          }
                          onClick={
                            isRecording ? stopRecording : startRecording
                          }
                          className={`flex size-10 items-center justify-center rounded-full transition hover:bg-[#FFF0E8] hover:text-[#FF4D00] ${
                            isRecording
                              ? "text-red-500"
                              : "text-[#686A72]"
                          }`}
                        >
                          <Mic size={22} strokeWidth={1.8} />
                        </button>

                        <button
                          type="button"
                          aria-label="Stickers"
                          title="Stickers"
                          onClick={() =>
                            toast.info("Sticker sending will be added next.")
                          }
                          className="flex size-10 items-center justify-center rounded-full text-[#686A72] transition hover:bg-[#FFF0E8] hover:text-[#FF4D00]"
                        >
                          <Sticker size={22} strokeWidth={1.8} />
                        </button>
                      </div>
                    )}
                  </div>
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

        {/* Conversation details panel */}
        {selectedContact && showDetails && (
          <ChatDetails
            contact={selectedContact}
            onClose={() => setShowDetails(false)}
            onReport={() => setShowReportDialog(true)}
            onDelete={() => setShowDeleteDialog(true)}
          />
        )}
      </section>

      {/* Full-size image dialog using shadcn */}
      <Dialog
        open={Boolean(imageDialogUrl)}
        onOpenChange={(open) => {
          if (!open) setImageDialogUrl(null);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto border-[#E4E1DB] bg-white p-3 sm:p-5">
          <DialogTitle className="sr-only">Image preview</DialogTitle>

          {imageDialogUrl && (
            <img
              src={imageDialogUrl}
              alt="Full-size image preview"
              className="mx-auto max-h-[82vh] w-auto max-w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

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