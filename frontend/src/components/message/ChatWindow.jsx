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
  Square,
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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ChatHeader from "./ChatHeader";
import InputBar from "./InputBar";
import MessageComponent from "./MessageComponent";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

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

const formatDuration = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

function UserAvatar({ user }) {
  const name = getName(user);

  return (
    <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E8] dark:bg-[#2A180E] font-semibold text-[#FF4D00]">
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
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const [showDetails, setShowDetails] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [imageDialogUrl, setImageDialogUrl] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordedAudioPreview, setRecordedAudioPreview] = useState("");
  const [recordedAudioDuration, setRecordedAudioDuration] = useState(0);
  const [recordingElapsed, setRecordingElapsed] = useState(0);

  const imageInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartedAtRef = useRef(null);
  const cancelRecordingRef = useRef(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);

  // --------------------------------------------------
  // Load messages.
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
        throw new Error(response?.message || "Unable to load messages.");
      }

      setMessages(response.messages || []);
      setIsMuted(Boolean(response.isMuted));
      setIsBlocked(Boolean(response.isBlocked));
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

  // Reset chat-specific state when changing conversations.
  useEffect(() => {
    // Discard an active recording when switching conversations.
    const recorder = mediaRecorderRef.current;

    if (recorder?.state === "recording") {
      cancelRecordingRef.current = true;
      recorder.stop();
    }

    setMessages([]);
    setDraft("");
    setError("");
    setSelectedImage(null);
    setRecordedAudio(null);
    setRecordedAudioDuration(0);
    setRecordingElapsed(0);
    setIsRecording(false);
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
  // Image preview URL.
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
  // Audio preview URL.
  // --------------------------------------------------

  useEffect(() => {
    if (!recordedAudio) {
      setRecordedAudioPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(recordedAudio);

    setRecordedAudioPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [recordedAudio]);

  // --------------------------------------------------
  // Close emoji picker on outside click.
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

  // --------------------------------------------------
  // Recording timer.
  // --------------------------------------------------

  useEffect(() => {
    if (!isRecording) return;

    const updateTimer = () => {
      const startedAt = recordingStartedAtRef.current;

      if (!startedAt) return;

      setRecordingElapsed(Math.floor((Date.now() - startedAt) / 1000));
    };

    updateTimer();

    const intervalId = window.setInterval(updateTimer, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRecording]);

  // --------------------------------------------------
  // Scroll to latest message.
  // --------------------------------------------------

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  // --------------------------------------------------
  // Receive new messages for the open conversation.
  // --------------------------------------------------

  useEffect(() => {
    const handleNewMessage = async ({ message }) => {
      if (!message || !selectedContact?._id) return;

      if (getId(message.sender) !== getId(selectedContact._id)) {
        return;
      }

      setMessages((currentMessages) => {
        const alreadyExists = currentMessages.some(
          (item) => getId(item._id) === getId(message._id),
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
  // Update Sent / Seen.
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
            : message,
        ),
      );
    };

    socket.on("message:read", handleMessagesRead);

    return () => {
      socket.off("message:read", handleMessagesRead);
    };
  }, []);

  // --------------------------------------------------
  // Image selection.
  // --------------------------------------------------

  const handleSelectImage = (event) => {
    const file = event.target.files?.[0];

    // Allow selecting the same file again.
    event.target.value = "";

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }

    // One attachment per message.
    setRecordedAudio(null);
    setRecordedAudioDuration(0);
    setSelectedImage(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // --------------------------------------------------
  // Send text, image, or voice message.
  // --------------------------------------------------

  const handleSend = async (event) => {
    event.preventDefault();

    const text = draft.trim();
    const image = selectedImage;
    const audio = recordedAudio;

    if (
      (!text && !image && !audio) ||
      !selectedContact?._id ||
      sending ||
      text.length > MAX_MESSAGE_LENGTH
    ) {
      return;
    }

    setSending(true);

    try {
      let payload = text;

      if (image || audio) {
        const formData = new FormData();

        if (image) {
          formData.append("image", image);
        }

        if (audio) {
          formData.append("audio", audio);
          formData.append("duration", String(recordedAudioDuration));
        }

        if (text) {
          formData.append("message", text);
        }

        payload = formData;
      }

      const response = await sendMessage(selectedContact._id, payload);

      if (!response?.success || !response.data) {
        throw new Error(response?.message || "Unable to send message.");
      }

      setMessages((currentMessages) => {
        const alreadyExists = currentMessages.some(
          (item) => getId(item._id) === getId(response.data._id),
        );

        return alreadyExists
          ? currentMessages
          : [...currentMessages, response.data];
      });

      setDraft("");
      setSelectedImage(null);
      setRecordedAudio(null);
      setRecordedAudioDuration(0);
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
        err.response?.data?.message || err.message || "Unable to send message.",
      );
    } finally {
      setSending(false);
    }
  };

  // --------------------------------------------------
  // Voice recording.
  // --------------------------------------------------

  const startRecording = async () => {
    let stream;

    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      ) {
        toast.error("Voice recording is not supported by this browser.");
        return;
      }

      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const supportedMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];

      const mimeType = supportedMimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recordingStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      cancelRecordingRef.current = false;
      recordingStartedAtRef.current = Date.now();

      setRecordingElapsed(0);
      setRecordedAudio(null);
      setRecordedAudioDuration(0);
      setSelectedImage(null);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        toast.error("Voice recording failed.");
      };

      recorder.onstop = () => {
        const activeStream = recordingStreamRef.current;

        activeStream?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;

        setIsRecording(false);

        if (cancelRecordingRef.current) {
          cancelRecordingRef.current = false;
          audioChunksRef.current = [];
          setRecordingElapsed(0);
          return;
        }

        const rawMimeType =
          recorder.mimeType || audioChunksRef.current[0]?.type || "audio/webm";

        const fileType = rawMimeType.split(";")[0];

        const audioBlob = new Blob(audioChunksRef.current, {
          type: fileType,
        });

        const startedAt = recordingStartedAtRef.current || Date.now();

        const duration = Math.max(0, (Date.now() - startedAt) / 1000);

        audioChunksRef.current = [];

        if (!audioBlob.size) {
          toast.error("No audio was recorded.");
          return;
        }

        if (audioBlob.size > MAX_ATTACHMENT_SIZE) {
          toast.error("Voice message must be 5 MB or smaller.");
          return;
        }

        const extension = fileType.includes("ogg")
          ? "ogg"
          : fileType.includes("mp4")
            ? "mp4"
            : "webm";

        const audioFile = new File(
          [audioBlob],
          `voice-${Date.now()}.${extension}`,
          { type: fileType },
        );

        setRecordedAudio(audioFile);
        setRecordedAudioDuration(duration);
        setRecordingElapsed(Math.floor(duration));
      };

      // Start exactly once.
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;

      console.error("Microphone access failed:", error);
      toast.error("Could not access your microphone.");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder?.state === "recording") {
      recorder.stop();
    }
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;

    cancelRecordingRef.current = true;
    audioChunksRef.current = [];

    setRecordedAudio(null);
    setRecordedAudioDuration(0);
    setRecordingElapsed(0);
    setIsRecording(false);

    if (recorder?.state === "recording") {
      recorder.stop();
    } else {
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());

      recordingStreamRef.current = null;
      cancelRecordingRef.current = false;
    }
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

  // --------------------------------------------------
  // Render.
  // --------------------------------------------------

  return (
    <>
      <section
        className={`relative flex h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-white dark:bg-black ${
          mobileChatOpen ? "flex" : "hidden md:flex"
        }`}
      >
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
          {selectedContact ? (
            <>
              <ChatHeader
                contact={selectedContact}
                onBack={onBack}
                showDetails={showDetails}
                onToggleDetails={() => setShowDetails((current) => !current)}
              />

              {/* Full-width message area */}
              <MessageComponent
                messages={messages}
                userId={user?._id}
                selectedContact={selectedContact}
                loading={loading}
                error={error}
                onRetry={loadMessages}
              />

              {/* Composer */}
              <InputBar
                selectedContact={selectedContact}
                onMessageSent={(newMessage) => {
                  setMessages((current) => {
                    const alreadyExists = current.some(
                      (message) =>
                        String(message._id) === String(newMessage._id),
                    );

                    return alreadyExists ? current : [...current, newMessage];
                  });
                }}
                onConversationUpdated={onConversationUpdated}
              />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <span className="flex size-20 items-center justify-center rounded-3xl bg-[#FFF0E8] dark:bg-[#2A180E] text-[#FF4D00]">
                <MessageCircle size={33} strokeWidth={1.6} />
              </span>

              <h2 className="mt-5 text-xl font-semibold tracking-tight text-[#1B1C20] dark:text-white">
                Your conversations, together
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-[#686A72] dark:text-neutral-400">
                Choose a conversation or search for someone to start a private
                chat.
              </p>
            </div>
          )}
        </div>

        {/* Conversation details */}
        {selectedContact && showDetails && (
          <ChatDetails
            contact={selectedContact}
            initialMuted={isMuted}
            initialBlocked={isBlocked}
            onMuteChanged={(val) => setIsMuted(val)}
            onBlockChanged={(val) => setIsBlocked(val)}
            onClose={() => setShowDetails(false)}
            onReport={() => setShowReportDialog(true)}
            onDelete={() => setShowDeleteDialog(true)}
          />
        )}
      </section>

      {/* Full-size image dialog */}
      <Dialog
        open={Boolean(imageDialogUrl)}
        onOpenChange={(open) => {
          if (!open) setImageDialogUrl(null);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto border-[#E4E1DB] dark:border-[#262626] bg-white dark:bg-[#181818] p-3 sm:p-5">
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
