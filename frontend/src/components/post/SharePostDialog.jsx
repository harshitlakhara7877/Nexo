import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Link2,
  Mail,
  Search,
  Send,
  X,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  getConversations,
  searchMessagePeople,
  sendMessage,
} from "@/services/messageService";

import { getShareSuggestions } from "@/services/userService";

const getId = (person) => String(person?._id ?? "");

const getName = (person) =>
  person?.name || person?.username || "Nexo user";

function ShareAvatar({ person }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = person?.profilePicture?.url;

  return (
    <span className="flex size-[64px] sm:size-[68px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#363636] text-lg font-semibold text-white shadow-inner">
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt=""
          onError={() => setImageFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        getName(person).charAt(0).toUpperCase()
      )}
    </span>
  );
}

function FacebookBrandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[22px] fill-white"
      aria-hidden="true"
    >
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5h1.7V3.7c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6v1.7H6.7V13h2.9v8h3.9Z" />
    </svg>
  );
}

function MessengerBrandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[22px] fill-white"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.14 2 11.26c0 2.92 1.46 5.52 3.74 7.18V22l3.41-1.87c.91.25 1.88.39 2.85.39 5.52 0 10-4.14 10-9.26C22 6.14 17.52 2 12 2Zm1 12.43-2.56-2.73-5 2.73 5.5-5.84 2.62 2.73 4.94-2.73-5.5 5.84Z" />
    </svg>
  );
}

function WhatsAppBrandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[22px] fill-white"
      aria-hidden="true"
    >
      <path d="M12 1.5A10.5 10.5 0 0 0 3 17.4L1.5 22.5l5.3-1.4A10.5 10.5 0 1 0 12 1.5Zm0 2a8.5 8.5 0 0 1 0 17c-1.4 0-2.7-.3-3.9-1l-.5-.3-3.1.8.8-3-.3-.5A8.5 8.5 0 0 1 12 3.5Zm-3 4c-.3 0-.6.1-.9.4-.3.3-1 1-1 2.3s1 2.7 1.2 2.9c.2.2 2 3.2 5 4.4 2.5 1 3 .8 3.5.7.5-.1 1.6-.7 1.8-1.4.2-.7.2-1.3.1-1.4-.1-.1-.3-.2-.6-.3l-2-.9c-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.7-.9-.7Z" />
    </svg>
  );
}

function ThreadsBrandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[20px] fill-white"
      aria-hidden="true"
    >
      <path d="M12.186 24C5.467 24 0 18.533 0 11.814 0 5.095 5.467 0 12.186 0c6.643 0 11.892 5.253 12.174 11.75h-2.22c-.27-5.234-4.524-9.53-9.954-9.53-5.523 0-10 4.477-10 10 0 5.523 4.477 10 10 10 4.164 0 7.802-2.585 9.253-6.425.18-.477.67-.735 1.157-.59.51.15.795.683.64 1.185C21.464 20.91 17.15 24 12.186 24Zm.014-6.4a5.6 5.6 0 1 1 5.6-5.6c0 1.25-.37 2.45-1.07 3.44-.3.42-.88.52-1.3.22-.42-.3-.52-.88-.22-1.3.47-.66.71-1.46.71-2.36a3.72 3.72 0 1 0-3.72 3.72c1.08 0 2.05-.46 2.73-1.2.36-.39.98-.41 1.37-.05.39.36.41.98.05 1.37-.99 1.09-2.39 1.76-3.95 1.76Z" />
    </svg>
  );
}

function XBrandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px] fill-white"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function SharePostDialog({
  open,
  onOpenChange,
  postUrl,
  postCaption = "",
  postId,
}) {
  const [contacts, setContacts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [accompanyingMessage, setAccompanyingMessage] = useState("");

  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);

  const footerRef = useRef(null);
  const query = searchQuery.trim();

  // Extract post ID from URL if not explicitly provided
  const effectivePostId =
    postId ||
    (postUrl ? postUrl.match(/\/post\/([a-fA-F0-9]{24})/)?.[1] : "") ||
    "";

  // Load suggestions (conversations, following, followers) whenever the modal opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadContacts = async () => {
      setLoadingContacts(true);

      try {
        const [conversationResponse, suggestionResponse] =
          await Promise.allSettled([
            getConversations(),
            getShareSuggestions(),
          ]);

        if (cancelled) return;

        const uniqueContacts = new Map();

        // Show recent messaging contacts first
        if (
          conversationResponse.status === "fulfilled" &&
          conversationResponse.value?.success
        ) {
          for (const conversation of conversationResponse.value.conversations || []) {
            const person = conversation.participant;
            const id = getId(person);
            if (id) uniqueContacts.set(id, person);
          }
        }

        // Add suggestions (followers/following)
        if (
          suggestionResponse.status === "fulfilled" &&
          suggestionResponse.value?.success
        ) {
          for (const person of suggestionResponse.value.users || []) {
            const id = getId(person);
            if (id && !uniqueContacts.has(id)) {
              uniqueContacts.set(id, person);
            }
          }
        }

        if (!cancelled) {
          setContacts([...uniqueContacts.values()]);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Share contacts error:", error);
          toast.error(
            error.response?.data?.message ||
              error.message ||
              "Unable to load contacts",
          );
        }
      } finally {
        if (!cancelled) setLoadingContacts(false);
      }
    };

    loadContacts();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Search is debounced to avoid sending a request on every keystroke
  useEffect(() => {
    if (!open || query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setSearching(true);

      try {
        const response = await searchMessagePeople(query);

        if (cancelled) return;

        if (!response?.success) {
          throw new Error(response?.message || "Search failed");
        }

        setSearchResults(response.users || []);
      } catch (error) {
        if (!cancelled) {
          console.error("Share contact search error:", error);
          setSearchResults([]);
          toast.error(
            error.response?.data?.message ||
              error.message ||
              "Unable to search users",
          );
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [open, query]);

  // Reset temporary selection and search when the dialog closes
  useEffect(() => {
    if (open) return;

    setSearchQuery("");
    setSearchResults([]);
    setSelectedUsers([]);
  }, [open]);

  const visibleContacts =
    query.length >= 2 ? searchResults : contacts;

  const toggleUser = (person) => {
    const id = getId(person);
    if (!id) return;

    setSelectedUsers((current) =>
      current.some((item) => getId(item) === id)
        ? current.filter((item) => getId(item) !== id)
        : [...current, person],
    );
  };

  const publicBase =
    import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

  const resolvedPostUrl =
    effectivePostId
      ? `${publicBase}/post/${effectivePostId}`
      : postUrl || `${publicBase}/`;

  const copyPostLink = async () => {
    if (!resolvedPostUrl) {
      toast.error("Post link is unavailable");
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }

      await navigator.clipboard.writeText(resolvedPostUrl);
      toast.success("Link copied to clipboard");
    } catch {
      window.prompt("Copy this post link:", resolvedPostUrl);
    }
  };

  const openExternal = (url) => {
    if (!resolvedPostUrl) {
      toast.error("Post link is unavailable");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareText = postCaption
    ? `${postCaption}\n\n${resolvedPostUrl}`
    : resolvedPostUrl;

  const whatsappText = postCaption
    ? `${postCaption}\n\n${resolvedPostUrl}`
    : `Check out this post on Nexo: ${resolvedPostUrl}`;

  // Sending creates a structured sharedContent message
  const handleSend = async () => {
    if (!resolvedPostUrl || selectedUsers.length === 0 || sending) return;

    setSending(true);

    try {
      const results = await Promise.allSettled(
        selectedUsers.map(async (person) => {
          const note = accompanyingMessage.trim();
          const response = await sendMessage(getId(person), {
            message: note
              ? `${note}\n${resolvedPostUrl}`
              : postCaption
              ? `${postCaption}\n${resolvedPostUrl}`
              : resolvedPostUrl,
            type: "share",
            sharedContent: {
              url: resolvedPostUrl,
              caption: postCaption || "",
              postId: effectivePostId || undefined,
              message: note || undefined,
            },
          });

          if (!response?.success) {
            throw new Error(
              response?.message || "Unable to send post",
            );
          }

          return getId(person);
        }),
      );

      const successfulIds = new Set(
        results
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value),
      );

      const failedCount = results.length - successfulIds.size;

      if (successfulIds.size > 0) {
        toast.success(
          `Shared with ${successfulIds.size} ${
            successfulIds.size === 1 ? "person" : "people"
          }`,
        );

        setSelectedUsers((current) =>
          current.filter(
            (person) => !successfulIds.has(getId(person)),
          ),
        );
      }

      if (failedCount > 0) {
        toast.error(
          `${failedCount} share${
            failedCount === 1 ? "" : "s"
          } could not be sent. You can retry the remaining recipients.`,
        );
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Share post error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to share this post",
      );
    } finally {
      setSending(false);
    }
  };

  const externalOptions = [
    {
      label: "Copy link",
      icon: <Link2 size={20} />,
      onClick: copyPostLink,
    },
    {
      label: "Facebook",
      icon: <FacebookBrandIcon />,
      onClick: () =>
        openExternal(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            resolvedPostUrl,
          )}`,
        ),
    },
    {
      label: "Messenger",
      icon: <MessengerBrandIcon />,
      onClick: () => {
        openExternal("https://www.messenger.com/");
        void copyPostLink();
      },
    },
    {
      label: "WhatsApp",
      icon: <WhatsAppBrandIcon />,
      onClick: () =>
        openExternal(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`,
        ),
    },
    {
      label: "Email",
      icon: <Mail size={20} />,
      onClick: () => {
        if (!resolvedPostUrl) return;

        window.location.href = `mailto:?subject=${encodeURIComponent(
          "Check out this Nexo post",
        )}&body=${encodeURIComponent(shareText)}`;
      },
    },
    {
      label: "Threads",
      icon: <ThreadsBrandIcon />,
      onClick: () =>
        openExternal(
          `https://www.threads.net/intent/post?text=${encodeURIComponent(
            shareText,
          )}`,
        ),
    },
    {
      label: "X",
      icon: <XBrandIcon />,
      onClick: () =>
        openExternal(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            shareText,
          )}`,
        ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="
          !flex h-[min(620px,88dvh)]
          w-[calc(100%-24px)] max-w-[640px]
          flex-col gap-0 overflow-hidden
          rounded-2xl sm:rounded-3xl border border-[#3A3A3A]
          bg-[#262626] p-0 text-white shadow-2xl
        "
      >
        {/* Header with Close button on top-left and Centered Title */}
        <header className="relative flex h-[52px] shrink-0 items-center justify-center border-b border-[#363636]">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close share dialog"
            className="absolute left-3.5 flex size-9 items-center justify-center rounded-full text-white transition hover:bg-[#383838]"
          >
            <X size={20} />
          </button>

          <DialogTitle className="text-base font-bold text-white">
            Share
          </DialogTitle>
        </header>

        {/* Search Field */}
        <div className="shrink-0 px-5 pt-4 pb-2">
          <div className="flex h-10 items-center gap-3 rounded-xl bg-[#363636] px-3.5 transition focus-within:ring-1 focus-within:ring-white/20">
            <Search size={18} className="shrink-0 text-[#8E8E93]" />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search people to share with"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#8E8E93]"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="text-[#8E8E93] hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Four-Column Grid of Contacts */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {loadingContacts && query.length < 2 ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#8E8E93]">
              <LoaderCircle size={18} className="animate-spin text-[#0095F6]" />
              Loading people...
            </div>
          ) : searching ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#8E8E93]">
              <LoaderCircle size={18} className="animate-spin text-[#0095F6]" />
              Searching...
            </div>
          ) : visibleContacts.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#8E8E93]">
              {query.length >= 2
                ? "No people found."
                : "No suggestions yet. Search for someone to share."}
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-x-2 gap-y-5 pt-2 pb-4">
              {visibleContacts.map((person) => {
                const id = getId(person);
                const selected = selectedUsers.some(
                  (item) => getId(item) === id,
                );

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleUser(person)}
                    aria-pressed={selected}
                    className="group flex min-w-0 flex-col items-center gap-2 rounded-xl p-1 transition hover:opacity-90"
                  >
                    <span
                      className={`relative rounded-full transition ${
                        selected
                          ? "ring-2 ring-[#0095F6] ring-offset-2 ring-offset-[#262626]"
                          : ""
                      }`}
                    >
                      <ShareAvatar person={person} />

                      {selected && (
                        <span className="absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full border-2 border-[#262626] bg-[#0095F6] text-white shadow">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </span>

                    <span className="w-full truncate text-center text-xs font-medium text-white">
                      {person.name || person.username || getName(person)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Accompanying message input when recipients are selected */}
        {selectedUsers.length > 0 && (
          <div className="shrink-0 border-t border-[#363636] bg-[#222222] px-4 py-2.5">
            <input
              type="text"
              value={accompanyingMessage}
              onChange={(e) => setAccompanyingMessage(e.target.value)}
              placeholder="Write a message..."
              className="w-full rounded-xl bg-[#363636] px-3.5 py-2 text-sm text-white placeholder-[#8E8E93] outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
        )}

        {/* Send Inside Nexo Button */}
        {selectedUsers.length > 0 && (
          <div className="shrink-0 border-t border-[#363636] bg-[#262626] p-3">
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0095F6] text-sm font-semibold text-white transition hover:bg-[#1877F2] disabled:opacity-60"
            >
              {sending ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {sending
                ? "Sending..."
                : selectedUsers.length === 1
                ? "Send"
                : `Send (${selectedUsers.length})`}
            </button>
          </div>
        )}

        {/* Fixed Bottom Footer with Horizontally Scrollable External Share Options */}
        <footer className="shrink-0 border-t border-[#363636] bg-[#1E1E1E] px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div
              ref={footerRef}
              className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {externalOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={option.onClick}
                  className="group flex w-[64px] shrink-0 flex-col items-center gap-1.5 rounded-lg py-1 text-center transition"
                >
                  <span className="flex size-[50px] items-center justify-center rounded-full bg-[#343434] text-white shadow-sm transition group-hover:bg-[#444444]">
                    {option.icon}
                  </span>
                  <span className="w-full truncate text-[11px] font-medium text-[#A8A8A8] transition group-hover:text-white">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                footerRef.current?.scrollBy({
                  left: 180,
                  behavior: "smooth",
                })
              }
              aria-label="Scroll sharing options right"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#343434] text-white shadow-sm transition hover:bg-[#444444]"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
