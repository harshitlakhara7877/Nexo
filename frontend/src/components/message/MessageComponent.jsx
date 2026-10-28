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

const getDomainFromUrl = (rawUrl) => {
  if (!rawUrl) return "";
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname || parsed.host;
  } catch {
    return rawUrl;
  }
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
  const isShare =
    message.type === "share" ||
    Boolean(message.sharedContent?.url);

  const stickerEmoji = message.sticker?.emoji || message.message;
  const isSticker =
    message.type === "sticker" ||
    (!isImage && !isVoice && !isShare && isEmojiOnly(message.message));

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
                  : "rounded-bl-md border border-[#E4E1DB] dark:border-[#2A2A2A] bg-[#F7F6F3] dark:bg-[#1C1C1E] text-[#1B1C20] dark:text-white"
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

        {/* Shared Content preview */}
        {isShare && (
          <div className="space-y-2.5">
            {/* Accompanying personal note / reply */}
            {message.sharedContent?.message && (
              <p className="whitespace-pre-wrap break-words text-sm font-medium leading-relaxed">
                {message.sharedContent.message}
              </p>
            )}

            {/* Clickable domain section showing the domain and URL */}
            <a
              href={message.sharedContent?.url || message.message}
              target="_blank"
              rel="noopener noreferrer"
              className={`block rounded-xl p-3 transition ${
                ownMessage
                  ? "bg-black/20 hover:bg-black/30 text-white"
                  : "bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-[#1B1C20] dark:text-white"
              }`}
            >
              <div className="text-xs font-semibold tracking-tight">
                {message.sharedContent?.domain ||
                  getDomainFromUrl(message.sharedContent?.url || message.message)}
              </div>
              <div
                className={`mt-1 truncate text-xs underline ${
                  ownMessage ? "text-white/90" : "text-[#0095F6] dark:text-[#3897f0]"
                }`}
              >
                {message.sharedContent?.url || message.message}
              </div>
              <div className="mt-1 text-[11px] opacity-75">
                {message.sharedContent?.domain ||
                  getDomainFromUrl(message.sharedContent?.url || message.message)}
              </div>
            </a>

            {/* The original post caption beneath it, when present */}
            {message.sharedContent?.caption?.trim() && (
              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                {message.sharedContent.caption}
              </p>
            )}

            {/* A second clickable URL below the caption */}
            <a
              href={message.sharedContent?.url || message.message}
              target="_blank"
              rel="noopener noreferrer"
              className={`block break-all text-xs font-medium underline hover:opacity-100 ${
                ownMessage ? "text-white/95" : "text-[#0095F6] dark:text-[#3897f0]"
              }`}
            >
              {message.sharedContent?.url || message.message}
            </a>
          </div>
        )}

        {/* Text message */}
        {!isImage && !isVoice && !isSticker && !isShare && (
          <p className="whitespace-pre-wrap break-words text-sm leading-6">
            {message.message}
          </p>
        )}

        {/* Timestamp and read receipt */}
        <div
          className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${
            ownMessage ? "text-white/75" : "text-[#85858D] dark:text-neutral-400"
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
    <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-black px-4 py-5 sm:px-6">
      {loading ? (
        <div className="flex h-full items-center justify-center gap-2 text-sm text-[#686A72] dark:text-neutral-400">
          <LoaderCircle
            size={18}
            className="animate-spin text-[#FF4D00]"
          />
          Loading messages...
        </div>
      ) : error ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <p className="text-sm text-[#686A72] dark:text-neutral-400">{error}</p>

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
          <span className="flex size-16 items-center justify-center rounded-full bg-[#FFF0E8] dark:bg-[#2A180E] text-[#FF4D00]">
            <MessageCircle size={27} />
          </span>

          <h3 className="mt-4 text-base font-semibold text-[#1B1C20] dark:text-white">
            Say hello to {getName(selectedContact)}
          </h3>

          <p className="mt-2 max-w-xs text-sm leading-6 text-[#686A72] dark:text-neutral-400">
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