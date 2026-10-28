import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Heart,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  UserRoundPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notificationService";

import {
  useNoti,
} from "@/context/NotificationContext";
import socket from "@/services/socket";

const PAGE_SIZE = 20;

const FILTERS = [
  { label: "All", value: "all" },
  { label: "People you follow", value: "following" },
  { label: "Comments", value: "comments" },
  { label: "Follows", value: "follows" },
];

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

const getDestination = (notification) => {
  const username = notification.sender?.username;

  if (notification.type === "message") {
    return username
      ? `/messages?user=${encodeURIComponent(username)}`
      : "/messages";
  }

  if (
    ["like", "comment"].includes(notification.type) &&
    notification.post?._id
  ) {
    return `/post/${notification.post._id}`;
  }

  return username
    ? `/profile/${username}`
    : "/notifications";
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

function NotificationIcon({ type }) {
  const props = {
    size: 18,
    strokeWidth: 1.8,
  };

  switch (type) {
    case "like":
      return <Heart {...props} />;
    case "comment":
    case "message":
      return <MessageCircle {...props} />;
    case "follow":
      return <UserRoundPlus {...props} />;
    default:
      return <Bell {...props} />;
  }
}

function NotificationRow({ notification, onOpen }) {
  const sender = notification.sender;
  const name = getActorName(sender);

  const [avatarFailed, setAvatarFailed] = useState(false);
  const [postImageFailed, setPostImageFailed] = useState(false);

  const avatarUrl = sender?.profilePicture?.url;
  const postImage = notification.post?.image?.url;

  const showPostImage =
    postImage &&
    !postImageFailed &&
    ["like", "comment"].includes(notification.type);

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={`flex w-full items-start gap-3 border-b border-[#E4E1DB] px-5 py-4 text-left transition hover:bg-[#FCFBF9] dark:border-[#262626] dark:hover:bg-[#1E1E1E] ${
        notification.isRead
          ? "bg-white dark:bg-[#121212]"
          : "bg-[#FFF8F3] dark:bg-[#1C1612]"
      }`}
    >
      {/* Sender avatar */}
      <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E8] text-sm font-semibold text-[#FF4D00] dark:bg-[#2A180E]">
        {avatarUrl && !avatarFailed ? (
          <img
            src={avatarUrl}
            alt=""
            onError={() => setAvatarFailed(true)}
            className="size-full object-cover"
          />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </span>

      {/* Notification content */}
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

      {/* Related post thumbnail or notification type */}
      {showPostImage ? (
        <img
          src={postImage}
          alt="Related post"
          loading="lazy"
          onError={() => setPostImageFailed(true)}
          className="size-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F7F6F3] text-[#686A72] dark:bg-[#202020] dark:text-neutral-300">
          <NotificationIcon type={notification.type} />
        </span>
      )}

      {/* Unread indicator */}
      {!notification.isRead && (
        <span
          aria-label="Unread"
          className="mt-4 size-2 shrink-0 rounded-full bg-[#FF4D00]"
        />
      )}
    </button>
  );
}

export default function NotificationPanel({ onClose }) {
  const navigate = useNavigate();

  const {
    unreadCount,
    setUnreadCount,
    refreshUnreadCount,
  } = useNoti();

  const [activeFilter, setActiveFilter] = useState("all");

  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  // Load a notification page whenever the filter or page changes.
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    getNotifications(page, PAGE_SIZE, {
      signal: controller.signal,
      filter: activeFilter,
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

          // Avoid duplicate rows when pages overlap.
          const existingIds = new Set(
            current.map((item) => String(item._id)),
          );

          return [
            ...current,
            ...response.notifications.filter(
              (item) =>
                !existingIds.has(String(item._id)),
            ),
          ];
        });

        setHasMore(Boolean(response.hasMore));

        // This is global, not restricted to the selected tab.
        if (
          Number.isFinite(Number(response.unreadCount))
        ) {
          setUnreadCount(
            Math.max(0, Number(response.unreadCount)),
          );
        }

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
  }, [
    page,
    activeFilter,
    retryKey,
    setUnreadCount,
  ]);

  useEffect(() => {
  const handleNewNotification = (payload = {}) => {
    const notification = payload.notification;

    if (!notification?._id) return;

    // The backend decides which notifications match
    // the "People you follow" filter.
    if (activeFilter === "following") {
      setNotifications([]);
      setPage(1);
      setHasMore(false);
      setError("");
      setLoading(true);
      setLoadingMore(false);
      setRetryKey((current) => current + 1);
      return;
    }

    // Respect the currently selected filter.
    if (
      activeFilter === "comments" &&
      notification.type !== "comment"
    ) {
      return;
    }

    if (
      activeFilter === "follows" &&
      notification.type !== "follow"
    ) {
      return;
    }

    setNotifications((current) => {
      return [
        notification,
        ...current,
      ].slice(0, Math.max(PAGE_SIZE, page * PAGE_SIZE));
    });
  };

  const handleNotificationRead = (payload = {}) => {
  if (!payload.notificationId) return;

  setNotifications((current) =>
    current.map((notification) =>
      String(notification._id) ===
      String(payload.notificationId)
        ? {
            ...notification,
            isRead: true,
            readAt: new Date().toISOString(),
          }
        : notification,
    ),
  );
};

  socket.on("notification:new", handleNewNotification);
  socket.on("notification:read", handleNotificationRead);

  return () => {
    socket.off("notification:new", handleNewNotification);
  };
}, [activeFilter, page]);

  // Switch tabs and restart pagination from the first page.
  const handleFilterChange = (filter) => {
    if (filter === activeFilter) return;

    setActiveFilter(filter);
    setPage(1);
    setNotifications([]);
    setHasMore(false);
    setError("");
    setLoading(true);
    setLoadingMore(false);
  };

  // Mark one notification read before navigating.
  // Navigation deliberately doesn't close the panel.
  const handleOpenNotification = async (notification) => {
    try {
      if (!notification.isRead) {
        const response = await markNotificationRead(
          notification._id,
        );

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Unable to mark notification as read.",
          );
        }

        setNotifications((current) =>
          current.map((item) =>
            String(item._id) ===
            String(notification._id)
              ? {
                  ...item,
                  isRead: true,
                  readAt:
                    new Date().toISOString(),
                }
              : item,
          ),
        );

        if (
          Number.isFinite(Number(response.unreadCount))
        ) {
          setUnreadCount(
            Math.max(0, Number(response.unreadCount)-1),
          );
        } else {
          await refreshUnreadCount();
        }
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to update notification.",
      );
    }
    onClose();
    navigate(getDestination(notification));
  };


  // Mark every notification read, including those on other pages.
  
  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;

    setMarkingAll(true);

    try {
      const response = await markAllNotificationsRead();

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to mark notifications as read.",
        );
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt:
            item.readAt || new Date().toISOString(),
        })),
      );

      setUnreadCount(0);

      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to mark notifications as read.",
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const handleRetry = () => {
    setError("");
    setLoading(page === 1);
    setLoadingMore(page > 1);
    setRetryKey((current) => current + 1);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || loading) return;

    setLoadingMore(true);
    setError("");
    setPage((current) => current + 1);
  };

  return (
    <>
      {/* Clicking outside the panel closes it. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close notifications panel"
        onClick={onClose}
        className="fixed inset-0 z-[60] cursor-default bg-black/20"
      />

      {/* Panel overlay: stays open until explicitly closed. */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-panel-title"
        onClick={(event) => event.stopPropagation()}
        className="fixed left-0 top-0 z-[70] flex h-dvh w-[500px] max-w-[calc(100vw-16px)] flex-col border-r border-[#E4E1DB] bg-white dark:border-[#262626] dark:bg-[#121212] shadow-2xl"
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E4E1DB] dark:border-[#262626] px-5 py-4">
          <div className="min-w-0">
            <h2
              id="notification-panel-title"
              className="text-xl font-bold text-[#1B1C20] dark:text-white"
            >
              Notifications
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              title="Close"
              className="flex size-9 items-center justify-center rounded-full text-[#686A72] dark:text-neutral-400 transition hover:bg-[#F7F6F3] dark:hover:bg-[#202020] hover:text-[#1B1C20] dark:hover:text-white"
            >
              <X size={21} />
            </button>
          </div>
        </header>

        {/* Filter tabs */}
        <div className="flex shrink-0 gap-3 overflow-x-auto border-b border-[#E4E1DB] dark:border-[#262626] px-4 py-3">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={activeFilter === filter.value}
              onClick={() =>
                handleFilterChange(filter.value)
              }
              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                activeFilter === filter.value
                  ? "border-[#FFF0E8] bg-[#FFF0E8] text-[#FF4D00] dark:border-[#2A180E] dark:bg-[#2A180E] dark:text-[#FF6A26]"
                  : "border-[#E4E1DB] bg-white text-[#686A72] hover:bg-[#F7F6F3] dark:border-[#262626] dark:bg-[#181818] dark:text-neutral-300 dark:hover:bg-[#202020]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Scrollable notification list */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-[#686A72] dark:text-neutral-400">
              <LoaderCircle
                size={18}
                className="animate-spin text-[#FF4D00]"
              />
              Loading notifications...
            </div>
          ) : error && notifications.length === 0 ? (
            <div className="p-6 text-center">
              <p
                role="alert"
                className="text-sm text-[#686A72] dark:text-neutral-400"
              >
                {error}
              </p>

              <button
                type="button"
                onClick={handleRetry}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#FF4D00]"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-[#FFF0E8] text-[#FF4D00] dark:bg-[#2A180E]">
                <Bell size={24} />
              </span>

              <h3 className="mt-4 font-semibold text-[#1B1C20] dark:text-white">
                {activeFilter === "all"
                  ? "You're all caught up"
                  : "No notifications in this filter"}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#686A72] dark:text-neutral-400">
                {activeFilter === "all"
                  ? "New likes, comments, follows, and messages will appear here."
                  : "Try another filter to see more activity."}
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification._id}
                  notification={notification}
                  onOpen={handleOpenNotification}
                />
              ))}

              {error && (
                <div className="p-4 text-center">
                  <p
                    role="alert"
                    className="text-sm text-[#686A72] dark:text-neutral-400"
                  >
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-2 text-sm font-semibold text-[#FF4D00]"
                  >
                    Try again
                  </button>
                </div>
              )}

              {hasMore && !error && (
                <div className="flex justify-center p-4">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore || loading}
                    className="inline-flex items-center gap-2 rounded-full border border-[#E4E1DB] dark:border-[#262626] px-5 py-2 text-sm font-medium text-[#1B1C20] dark:text-white transition hover:border-[#FF4D00] hover:text-[#FF4D00] dark:hover:border-[#FF4D00] dark:hover:text-[#FF4D00] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingMore && (
                      <LoaderCircle
                        size={15}
                        className="animate-spin"
                      />
                    )}
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}