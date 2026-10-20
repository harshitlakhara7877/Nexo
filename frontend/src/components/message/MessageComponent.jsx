import { useEffect, useRef } from "react";
import { Check, CheckCheck, LoaderCircle, MessageCircle } from "lucide-react";

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

// Used for emoji stickers sent through the existing text-message endpoint.
const isEmojiOnly = (value) => {
  const text = String(value || "").trim();

  return (
    text.length > 0 &&
    text.length <= 8 &&
    !/\s/.test(text) &&
    /\p{Extended_Pictographic}/u.test(text)
  );
};

function MessageBubble({ message, ownMessage }) {
  const isImage = message.type === "image" || Boolean(message.image?.url);
  const isVoice = message.type === "voice" || Boolean(message.audio?.url);

  const stickerEmoji = message.sticker?.emoji || message.message;
  const isSticker =
    message.type === "sticker" ||
    (!isImage && !isVoice && isEmojiOnly(message.message));

  return (
    <div
      className={`flex ${
        ownMessage ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[85%] sm:max-w-[75%] ${
          isSticker
            ? "px-1 py-1"
            : `rounded-2xl px-4 py-3 ${
                ownMessage
                  ? "rounded-br-md bg-[#FF4D00] text-white"
                  : "rounded-bl-md border border-[#E4E1DB] bg-[#F7F6F3] text-[#1B1C20]"
              }`
        }`}
      >
        {/* Sticker */}
        {isSticker && (
          <div
            className="select-none text-5xl leading-tight"
            role="img"
            aria-label="Sticker"
          >
            {stickerEmoji}
          </div>
        )}

        {/* Image message */}
        {isImage && (
          <div className="space-y-2">
            {message.image?.url ? (
              <img
                src={message.image.url}
                alt="Shared image"
                loading="lazy"
                className="max-h-80 max-w-full rounded-lg object-contain"
              />
            ) : (
              <p className="text-sm">Image unavailable</p>
            )}

            {message.message?.trim() && (
              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                {message.message}
              </p>
            )}
          </div>
        )}

        {/* Voice message */}
        {isVoice && (
          <div className="min-w-48 max-w-full">
            {message.audio?.url ? (
              <audio
                controls
                preload="metadata"
                src={message.audio.url}
                className="max-w-full"
              />
            ) : (
              <p className="text-sm">Voice message unavailable</p>
            )}
          </div>
        )}

        {/* Text message */}
        {!isImage && !isVoice && !isSticker && (
          <p className="whitespace-pre-wrap break-words text-sm leading-6">
            {message.message}
          </p>
        )}

        {/* Timestamp and read receipt */}
        <div
          className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${
            ownMessage ? "text-white/75" : "text-[#85858D]"
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>

          {ownMessage &&
            (message.isRead ? (
              <CheckCheck size={13} aria-label="Read" />
            ) : (
              <Check size={12} aria-label="Sent" />
            ))}
        </div>
      </div>
    </div>
  );
}

export default function MessageComponent({
  messages = [],
  userId,
  selectedContact,
  loading,
  error,
  onRetry,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  return (
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
            onClick={onRetry}
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
        <div className="mx-auto flex p-6 flex-col gap-4">
          {messages.map((message) => {
            const ownMessage =
              getId(message.sender) === getId(userId);

            return (
              <MessageBubble
                key={message._id}
                message={message}
                ownMessage={ownMessage}
              />
            );
          })}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}