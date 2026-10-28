import { useState, useEffect, useMemo } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getUserFollowers,
  getUserFollowing,
  followOrUnfollow,
  removeFollower,
} from "@/services/userService";
import { useAuth } from "@/context/AuthContext";

export default function FollowersFollowingDialog({
  isOpen,
  onClose,
  userId,
  initialTab = "followers", // "followers" | "following"
  isOwnProfile = false,
  onStatsChange,
}) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const currentUserId = String(currentUser?._id || currentUser?.id || "");

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen || !userId) return;

    let cancelled = false;

    const loadUsers = async () => {
      try {
        setLoading(true);
        const fetcher =
          activeTab === "followers" ? getUserFollowers : getUserFollowing;
        const res = await fetcher(userId);

        if (cancelled) return;

        if (res?.success && Array.isArray(res.users)) {
          setUsers(res.users);
        } else {
          setUsers([]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load user list:", err);
          toast.error(
            err.response?.data?.message || `Unable to load ${activeTab}`
          );
          setUsers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [isOpen, userId, activeTab]);

  // Filtered users by search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // Follow/unfollow toggle
  const handleFollowToggle = async (targetUser) => {
    const targetId = String(targetUser._id || targetUser.id);
    if (!targetId || actionLoadingId) return;

    try {
      setActionLoadingId(targetId);
      const res = await followOrUnfollow(targetId);

      if (res?.success) {
        // Update user's follow state in list
        setUsers((prev) =>
          prev.map((u) => {
            if (String(u._id || u.id) === targetId) {
              const followers = u.followers || [];
              const alreadyInList = followers.some(
                (f) => String(f._id || f) === currentUserId
              );
              return {
                ...u,
                isFollowing: res.isFollowing,
                followers: res.isFollowing
                  ? [...followers, currentUserId]
                  : followers.filter((f) => String(f._id || f) !== currentUserId),
              };
            }
            return u;
          })
        );

        if (onStatsChange) onStatsChange();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update follow status");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove follower (for own profile)
  const handleRemoveFollower = async (targetUser) => {
    const targetId = String(targetUser._id || targetUser.id);
    if (!targetId || actionLoadingId) return;

    try {
      setActionLoadingId(targetId);
      const res = await removeFollower(targetId);

      if (res?.success) {
        setUsers((prev) => prev.filter((u) => String(u._id || u.id) !== targetId));
        toast.success(`Removed @${targetUser.username} from followers`);
        if (onStatsChange) onStatsChange();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove follower");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUserClick = (username) => {
    onClose();
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative flex h-[480px] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white text-[#1B1C20] shadow-2xl dark:border-[#262626] dark:bg-[#121212] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close */}
        <div className="relative flex items-center justify-center border-b border-[#E4E1DB] px-4 py-3.5 dark:border-[#262626]">
          <h2 className="text-base font-semibold capitalize">
            {activeTab}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 rounded-full p-1 text-[#686A72] transition hover:bg-[#F7F6F3] hover:text-[#1B1C20] dark:text-neutral-400 dark:hover:bg-[#202020] dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switchers if wanted */}
        <div className="grid grid-cols-2 border-b border-[#E4E1DB] text-center text-sm font-medium dark:border-[#262626]">
          <button
            type="button"
            onClick={() => setActiveTab("followers")}
            className={`py-2.5 transition ${
              activeTab === "followers"
                ? "border-b-2 border-[#FF4D00] font-semibold text-[#FF4D00]"
                : "text-[#686A72] hover:text-[#1B1C20] dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            Followers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("following")}
            className={`py-2.5 transition ${
              activeTab === "following"
                ? "border-b-2 border-[#FF4D00] font-semibold text-[#FF4D00]"
                : "text-[#686A72] hover:text-[#1B1C20] dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            Following
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3.5 pb-2">
          <div className="relative flex items-center">
            <Search
              size={16}
              className="absolute left-3 text-[#686A72] dark:text-neutral-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-xl border border-transparent bg-[#F7F6F3] py-2 pl-9 pr-3 text-sm text-[#1B1C20] placeholder-[#686A72] focus:border-[#E4E1DB] focus:outline-none dark:bg-[#1E1E1E] dark:text-white dark:placeholder-neutral-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-[#686A72] hover:text-[#1B1C20] dark:text-neutral-400"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto px-3.5 py-2">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 size={24} className="animate-spin text-[#FF4D00]" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-[#686A72] dark:text-neutral-400">
                {searchQuery ? "No users found" : `No ${activeTab} yet`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredUsers.map((u) => {
                const targetId = String(u._id || u.id);
                const isTargetCurrentUser = targetId === currentUserId;

                // Determine whether current user is following this user
                const isUserFollowing =
                  u.isFollowing !== undefined
                    ? u.isFollowing
                    : (u.followers || []).some(
                        (f) => String(f._id || f) === currentUserId
                      );

                const isCurrentActionLoading = actionLoadingId === targetId;

                return (
                  <div
                    key={targetId}
                    className="flex items-center justify-between gap-3 rounded-xl p-2 transition hover:bg-[#F7F6F3] dark:hover:bg-[#1A1A1A]"
                  >
                    {/* User info */}
                    <div
                      onClick={() => handleUserClick(u.username)}
                      className="flex cursor-pointer items-center gap-3 min-w-0 flex-1"
                    >
                      <div className="size-11 shrink-0 overflow-hidden rounded-full bg-[#FFF0E8] dark:bg-[#202020]">
                        {u.profilePicture?.url ? (
                          <img
                            src={u.profilePicture.url}
                            alt={u.username}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center font-bold text-[#FF4D00]">
                            {u.username?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-sm font-semibold text-[#1B1C20] dark:text-white">
                          {u.username}
                        </span>
                        {u.name && (
                          <span className="block truncate text-xs text-[#686A72] dark:text-neutral-400">
                            {u.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    {!isTargetCurrentUser && (
                      <div className="shrink-0">
                        {isOwnProfile && activeTab === "followers" ? (
                          <button
                            type="button"
                            disabled={isCurrentActionLoading}
                            onClick={() => handleRemoveFollower(u)}
                            className="rounded-xl border border-[#E4E1DB] bg-[#F7F6F3] px-3.5 py-1.5 text-xs font-semibold text-[#1B1C20] transition hover:bg-[#EEECE8] dark:border-[#333333] dark:bg-[#202020] dark:text-white dark:hover:bg-[#2A2A2A] disabled:opacity-50"
                          >
                            {isCurrentActionLoading ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              "Remove"
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isCurrentActionLoading}
                            onClick={() => handleFollowToggle(u)}
                            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                              isUserFollowing
                                ? "border border-[#E4E1DB] bg-[#F7F6F3] text-[#1B1C20] hover:bg-[#EEECE8] dark:border-[#333333] dark:bg-[#202020] dark:text-white dark:hover:bg-[#2A2A2A]"
                                : "bg-[#FF4D00] text-white hover:bg-[#E64400]"
                            }`}
                          >
                            {isCurrentActionLoading ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : isUserFollowing ? (
                              "Following"
                            ) : (
                              "Follow"
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
