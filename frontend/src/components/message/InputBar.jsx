import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  LoaderCircle,
  Mic,
  Send,
  Smile,
  Square,
  Sticker,
  X,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { toast } from "sonner";

import { sendMessage } from "@/services/messageService";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const STICKERS = [
  { id: "love", emoji: "❤️", label: "Love" },
  { id: "laugh", emoji: "😂", label: "Laughing" },
  { id: "happy", emoji: "🥰", label: "Happy" },
  { id: "thumbs-up", emoji: "👍", label: "Thumbs up" },
  { id: "wave", emoji: "👋", label: "Wave" },
  { id: "party", emoji: "🎉", label: "Celebrate" },
  { id: "fire", emoji: "🔥", label: "Fire" },
  { id: "sad", emoji: "🥹", label: "Touched" },
  { id: "thinking", emoji: "🤔", label: "Thinking" },
  { id: "cool", emoji: "😎", label: "Cool" },
  { id: "clap", emoji: "👏", label: "Clapping" },
  { id: "heart-eyes", emoji: "😍", label: "Heart eyes" },
];

const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
};

export default function InputBar({
  selectedContact,
  onMessageSent,
  onConversationUpdated,
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [selectedAudio, setSelectedAudio] = useState(null);
  const [audioPreview, setAudioPreview] = useState("");
  const [audioDuration, setAudioDuration] = useState(0);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);
  const discardRecordingRef = useRef(false);

  // Create and clean up the image preview URL.
  useEffect(() => {
    if (!selectedImage) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(selectedImage);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedImage]);

  // Create and clean up the recorded-audio preview URL.
  useEffect(() => {
    if (!selectedAudio) {
      setAudioPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(selectedAudio);
    setAudioPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedAudio]);

  // Update the recording timer while the microphone is active.
  useEffect(() => {
    if (!isRecording) return undefined;

    const intervalId = window.setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - recordingStartedAtRef.current) / 1000,
      );

      setRecordingSeconds(elapsed);
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [isRecording]);

  // Stop the microphone if the component unmounts while recording.
  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;

      if (recorder?.state === "recording") {
        recorder.onstop = null;
        recorder.stop();
      }

      mediaRecorderRef.current?.stream
        ?.getTracks()
        .forEach((track) => track.stop());
    };
  }, []);

  const handleSend = async (event) => {
    event?.preventDefault();

    const text = draft.trim();

    if (
      (!text && !selectedImage && !selectedAudio) ||
      !selectedContact?._id ||
      sending
    ) {
      return;
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      toast.error("Messages cannot exceed 2000 characters.");
      return;
    }

    setSending(true);

    try {
      let payload = text;

      if (selectedImage) {
        const formData = new FormData();

        formData.append("image", selectedImage);

        if (text) {
          formData.append("message", text);
        }

        payload = formData;
      } else if (selectedAudio) {
        const formData = new FormData();

        formData.append("audio", selectedAudio);
        formData.append("duration", String(audioDuration));

        payload = formData;
      }

      const response = await sendMessage(
        selectedContact._id,
        payload,
      );

      if (!response?.success || !response.data) {
        throw new Error(
          response?.message || "Unable to send message.",
        );
      }

      onMessageSent?.(response.data);
      onConversationUpdated?.();

      setDraft("");
      setSelectedImage(null);
      setSelectedAudio(null);
      setAudioDuration(0);
      setShowEmojiPicker(false);
      setShowStickerPicker(false);

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      textareaRef.current?.focus();
    } catch (err) {
      console.error("Send message error:", err);

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to send message.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleImageSelection = (event) => {
    const file = event.target.files?.[0];

    // Allow selecting the same file again later.
    event.target.value = "";

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }

    setSelectedAudio(null);
    setSelectedImage(file);
  };

  const startRecording = async () => {
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      ) {
        toast.error("Voice recording is not supported by this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const preferredType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const recorder = preferredType
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      discardRecordingRef.current = false;
      recordingStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const duration = Math.max(
          1,
          Math.round(
            (Date.now() - recordingStartedAtRef.current) / 1000,
          ),
        );

        if (
          !discardRecordingRef.current &&
          audioChunksRef.current.length > 0
        ) {
          const blob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });

          const file = new File(
            [blob],
            `voice-${Date.now()}.webm`,
            { type: blob.type },
          );

          setSelectedImage(null);
          setSelectedAudio(file);
          setAudioDuration(duration);
        }

        stream.getTracks().forEach((track) => track.stop());
        audioChunksRef.current = [];
        setIsRecording(false);
        setRecordingSeconds(0);
      };

      recorder.start();

      setSelectedImage(null);
      setSelectedAudio(null);
      setRecordingSeconds(0);
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access failed:", error);
      toast.error("Allow microphone access to record a voice message.");
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

    discardRecordingRef.current = true;

    if (recorder?.state === "recording") {
      recorder.stop();
    } else {
      setIsRecording(false);
      setRecordingSeconds(0);
    }
  };

  // The current message endpoint supports text messages, so a selected
  // emoji sticker is sent as a standalone emoji message.
  const handleSendSticker = async (sticker) => {
    if (!selectedContact?._id || sending) return;

    setSending(true);

    try {
      const response = await sendMessage(
        selectedContact._id,
        sticker.emoji,
      );

      if (!response?.success || !response.data) {
        throw new Error(response?.message || "Unable to send sticker.");
      }

      onMessageSent?.(response.data);
      onConversationUpdated?.();
      setShowStickerPicker(false);
    } catch (err) {
      console.error("Send sticker error:", err);

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to send sticker.",
      );
    } finally {
      setSending(false);
    }
  };

  const canSend =
    Boolean(draft.trim()) || Boolean(selectedImage) || Boolean(selectedAudio);

  return (
    <form
      onSubmit={handleSend}
      className="relative shrink-0 sm:px-5 sm:py-4 dark:bg-black"
    >
      {/* Image and voice previews */}
      {(imagePreview || audioPreview) && (
        <div className="mx-auto mb-3 flex max-w-4xl items-center gap-3">
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Selected image preview"
                className="size-20 rounded-lg border border-[#E4E1DB] dark:border-[#262626] object-cover"
              />

              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                aria-label="Remove selected image"
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-[#1B1C20] text-white"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {audioPreview && (
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#E4E1DB] dark:border-[#262626] bg-[#F7F6F3] dark:bg-[#1C1C1E] p-2">
              <audio
                controls
                src={audioPreview}
                className="min-w-0 flex-1"
              />

              <button
                type="button"
                onClick={() => {
                  setSelectedAudio(null);
                  setAudioDuration(0);
                }}
                aria-label="Remove voice recording"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#686A72] dark:text-neutral-400 hover:bg-white dark:hover:bg-[#202020] hover:text-[#FF4D00]"
              >
                <X size={17} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recording status */}
      {isRecording && (
        <div className="mx-auto mb-3 flex max-w-4xl items-center justify-between rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <span className="size-2 animate-pulse rounded-full bg-red-500" />
            Recording voice message
            <span className="font-mono">
              {formatDuration(recordingSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="rounded-lg px-3 py-1.5 text-sm text-[#686A72] dark:text-neutral-400 hover:bg-white dark:hover:bg-[#202020]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={stopRecording}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      <div className="relative mx-auto flex w-full items-end gap-2 rounded-2xl border border-[#E4E1DB] bg-white dark:border-[#262626] dark:bg-[#121212] p-2">
        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 z-30 mb-3">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                setDraft((current) =>
                  (current + emojiData.emoji).slice(
                    0,
                    MAX_MESSAGE_LENGTH,
                  ),
                );

                textareaRef.current?.focus();
              }}
              width={300}
              height={350}
            />
          </div>
        )}

        {/* Sticker picker */}
        {showStickerPicker && (
          <div className="absolute bottom-full right-0 z-30 mb-3 w-72 rounded-2xl border border-[#E4E1DB] bg-white dark:border-[#262626] dark:bg-[#181818] p-3 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1B1C20] dark:text-white">
                Stickers
              </h3>

              <button
                type="button"
                onClick={() => setShowStickerPicker(false)}
                aria-label="Close sticker picker"
                className="flex size-7 items-center justify-center rounded-full text-[#686A72] dark:text-neutral-400 hover:bg-[#F7F6F3] dark:hover:bg-[#202020]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {STICKERS.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  disabled={sending}
                  onClick={() => handleSendSticker(sticker)}
                  aria-label={`Send ${sticker.label} sticker`}
                  title={sticker.label}
                  className="flex aspect-square items-center justify-center rounded-xl text-3xl transition hover:scale-110 hover:bg-[#FFF0E8] dark:hover:bg-[#2A180E] disabled:opacity-40"
                >
                  {sticker.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Emoji button */}
        <button
          type="button"
          aria-label="Choose emoji"
          title="Emoji"
          onClick={() => {
            setShowEmojiPicker((open) => !open);
            setShowStickerPicker(false);
          }}
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition hover:bg-[#FFF0E8] dark:hover:bg-[#2A180E] hover:text-[#FF4D00] ${
            showEmojiPicker ? "text-[#FF4D00]" : "text-[#1B1C20] dark:text-white"
          }`}
        >
          <Smile size={22} strokeWidth={1.8} />
        </button>

        {/* Message input */}
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) =>
            setDraft(event.target.value.slice(0, MAX_MESSAGE_LENGTH))
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();

              if (canSend && !sending) {
                handleSend();
              }
            }
          }}
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={
            selectedContact?.username
              ? `Message...`
              : "Write a message..."
          }
          aria-label="Write a message"
          className="max-h-32 min-h-10 flex-1 resize-y bg-transparent px-2 py-3 text-sm leading-5 text-[#1B1C20] dark:text-white outline-none placeholder:text-[#9A9CA3] dark:placeholder:text-neutral-500"
        />

        {/* Send button */}
        {canSend ? (
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
          <div className="flex shrink-0 items-center gap-1">
            {/* Voice recording */}
            <button
              type="button"
              disabled={sending}
              onClick={isRecording ? stopRecording : startRecording}
              aria-label={
                isRecording ? "Stop recording" : "Record voice message"
              }
              title={isRecording ? "Stop recording" : "Voice message"}
              className={`flex size-10 items-center justify-center rounded-xl transition hover:bg-[#FFF0E8] dark:hover:bg-[#2A180E] hover:text-[#FF4D00] ${
                isRecording ? "text-red-500" : "text-[#1B1C20] dark:text-white"
              }`}
            >
              {isRecording ? (
                <Square size={19} fill="currentColor" />
              ) : (
                <Mic size={22} strokeWidth={1.8} />
              )}
            </button>

            {/* Image attachment */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageSelection}
            />

            <button
              type="button"
              disabled={sending || isRecording}
              onClick={() => imageInputRef.current?.click()}
              aria-label="Attach image"
              title="Attach image"
              className="flex size-10 items-center justify-center rounded-xl text-[#1B1C20] dark:text-white transition hover:bg-[#FFF0E8] dark:hover:bg-[#2A180E] hover:text-[#FF4D00] disabled:opacity-40"
            >
              <ImageIcon size={22} strokeWidth={1.8} />
            </button>

            {/* Sticker picker */}
            <button
              type="button"
              disabled={sending || isRecording}
              onClick={() => {
                setShowStickerPicker((open) => !open);
                setShowEmojiPicker(false);
              }}
              aria-label="Open sticker picker"
              title="Stickers"
              className={`flex size-10 items-center justify-center rounded-xl transition hover:bg-[#FFF0E8] dark:hover:bg-[#2A180E] hover:text-[#FF4D00] ${
                showStickerPicker ? "text-[#FF4D00]" : "text-[#1B1C20] dark:text-white"
              }`}
            >
              <Sticker size={22} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>

      <p className="mx-auto mt-2 max-w-4xl px-1 text-[11px] text-[#9A9CA3] dark:text-neutral-500">
        Enter to send · Shift + Enter for a new line
      </p>
    </form>
  );
}