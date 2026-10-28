import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Heart,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  UserRoundPlus,
} from "lucide-react";

import { getNotifications } from "@/services/notificationService";

const PAGE_SIZE = 20;

const getActorName = (sender) =>
  sender?.name || sender?.username || "Someone";

const getNotificationText = (notification) => {
  switch (notification.type) {
    case "like":
      return "liked your post";
    case "comment":
      return "commented on your post";
    case "follow":
      return "started following you";
    case "message":
      return "sent you a message";
    default:
      return "interacted with you";
  }
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getDestination = (notification) => {
  const username = notification.sender?.username;

  if (notification.type === "message") {
    return username
      ? `/messages?user=${encodeURIComponent(username)}`
      : "/messages";
  }

  if (
    (notification.type === "like" ||
      notification.type === "comment") &&
    notification.post?._id
  ) {
    return `/post/${notification.post._id}`;
  }

  if (username) {
    return `/profile/${username}`;
  }

  return "/notifications";
};

function NotificationIcon({ type }) {
  const iconProps = {
    size: 18,
    strokeWidth: 1.8,
  };

  switch (type) {
    case "like":
      return <Heart {...iconProps} />;
    case "comment":
      return <MessageCircle {...iconProps} />;
    case "follow":
      return <UserRoundPlus {...iconProps} />;
    case "message":
      return <MessageCircle {...iconProps} />;
    default:
      return <Bell {...iconProps} />;
  }
}

function NotificationRow({ notification, onOpen }) {
  const sender = notification.sender;
  const name = getActorName(sender);

  const [imageFailed, setImageFailed] = useState(false);

  const avatarUrl = sender?.profilePicture?.url;
  const postImage = notification.post?.image?.url;

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={`flex w-full items-start gap-3 border-b border-[#E4E1DB] dark:border-[#262626] px-4 py-4 text-left transition hover:bg-[#FCFBF9] dark:hover:bg-[#1E1E1E] sm:px-5 ${
        notification.isRead ? "bg-white dark:bg-[#121212]" : "bg-[#FFF8F3] dark:bg-[#1C1612]"
      }`}
    >
      {/* Sender avatar */}
      <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E8] dark:bg-[#2A180E] text-sm font-semibold text-[#FF4D00]">
        {avatarUrl && !imageFailed ? (
          <img
            src={avatarUrl}
            alt=""
            onError={() => setImageFailed(true)}
            className="size-full rounded-full object-cover"
          />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </span>

      {/* Notification message */}
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-6 text-[#1B1C20] dark:text-white">
          <strong className="font-semibold text-[#1B1C20] dark:text-white">{name}</strong>{" "}
          <span className="text-[#1B1C20] dark:text-neutral-200">{getNotificationText(notification)}.</span>
        </span>

        {notification.type === "comment" &&
          notification.comment?.text && (
            <span className="mt-1 block line-clamp-2 text-sm text-[#686A72] dark:text-neutral-400">
              “{notification.comment.text}”
            </span>
          )}

        <span className="mt-1 block text-xs text-[#8B8B92] dark:text-neutral-500">
          {formatDate(notification.createdAt)}
        </span>
      </span>

      {/* Related post image or notification type */}
      {postImage &&
      (notification.type === "like" ||
        notification.type === "comment") ? (
        <img
          src={postImage}
          alt="Related post"
          loading="lazy"
          className="size-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F7F6F3] dark:bg-[#202020] text-[#686A72] dark:text-neutral-300">
          <NotificationIcon type={notification.type} />
        </span>
      )}

      {/* Visual indicator only; read handling comes in 14.7. */}
      {!notification.isRead && (
        <span
          aria-label="Unread"
          className="mt-4 size-2 shrink-0 rounded-full bg-[#FF4D00]"
        />
      )}
    </button>
  );
}

export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    getNotifications(page, PAGE_SIZE, {
      signal: controller.signal,
    })
      .then((response) => {
        if (
          !response?.success ||
          !Array.isArray(response.notifications)
        ) {
          throw new Error(
            response?.message ||
              "Unable to load notifications.",
          );
        }

        if (cancelled) return;

        setNotifications((current) => {
          if (page === 1) {
            return response.notifications;
          }

          // Avoid duplicates if a page overlaps with existing data.
          const existingIds = new Set(
            current.map((item) => String(item._id)),
          );

          return [
            ...current,
            ...response.notifications.filter(
              (item) => !existingIds.has(String(item._id)),
            ),
          ];
        });

        setHasMore(Boolean(response.hasMore));
        setError("");
      })
      .catch((err) => {
        if (
          cancelled ||
          err.code === "ERR_CANCELED"
        ) {
          return;
        }

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load notifications.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, retryKey]);

  const handleOpen = useCallback(
    (notification) => {
      // Navigation only for Phase 14.6.
      // Marking the notification as read comes in Phase 14.7.
      navigate(getDestination(notification));
    },
    [navigate],
  );

  const retry = () => {
    setError("");
    setLoading(true);
    setLoadingMore(false);
    setRetryKey((current) => current + 1);
  };

  return (
    <main className="min-h-screen bg-[#F7F6F3] dark:bg-black px-4 py-6 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1B1C20] dark:text-white">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-[#686A72] dark:text-neutral-400">
            Your latest activity on Nexo.
          </p>
        </div>

        <section
          aria-label="Notification list"
          className="overflow-hidden rounded-2xl border border-[#E4E1DB] dark:border-[#262626] bg-white dark:bg-[#121212]"
        >
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-[#686A72] dark:text-neutral-400">
              <LoaderCircle
                size={18}
                className="animate-spin text-[#FF4D00]"
              />
              Loading notifications...
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p
                role="alert"
                className="text-sm text-[#686A72] dark:text-neutral-400"
              >
                {error}
              </p>

              <button
                type="button"
                onClick={retry}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#FF4D00]"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-[#FFF0E8] dark:bg-[#2A180E] text-[#FF4D00]">
                <Bell size={24} />
              </span>

              <h2 className="mt-4 font-semibold text-[#1B1C20] dark:text-white">
                You're all caught up
              </h2>

              <p className="mt-2 text-sm text-[#686A72] dark:text-neutral-400">
                New likes, comments, follows, and messages
                will appear here.
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification._id}
                  notification={notification}
                  onOpen={handleOpen}
                />
              ))}

              {hasMore && (
                <div className="flex justify-center p-4">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => {
                      setLoadingMore(true);
                      setError("");
                      setPage((current) => current + 1);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-[#E4E1DB] dark:border-[#262626] px-5 py-2 text-sm font-medium text-[#1B1C20] dark:text-white hover:border-[#FF4D00] hover:text-[#FF4D00] dark:hover:border-[#FF4D00] dark:hover:text-[#FF4D00] disabled:opacity-50"
                  >
                    {loadingMore && (
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                    )}
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}