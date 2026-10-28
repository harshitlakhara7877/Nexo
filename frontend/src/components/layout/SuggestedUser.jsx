import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, Users } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import {
  followOrUnfollow,
  getSuggesetedUsers,
} from "@/services/userService";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../ui/avatar";
import { Button } from "../ui/button";

const PREVIEW_LIMIT = 5;

const SuggestedUser = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingStates, setFollowingStates] = useState({});
  const [followingUserId, setFollowingUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Fetch suggested users
  const fetchSuggestedUsers = useCallback(async () => {
    if (!user?._id) {
      setSuggestedUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getSuggesetedUsers();
      // const data = response?.data ?? response;

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to load suggested users."
        );
      }

      const users = response.users

      setSuggestedUsers(users);

      // Initialize follow states from the current user's following list.
      const initialStates = {};

      users.forEach((suggestedUser) => {
        initialStates[suggestedUser._id] = (
          user.following || []
        ).some(
          (followingUser) =>
            String(
              typeof followingUser === "object"
                ? followingUser._id
                : followingUser
            ) === String(suggestedUser._id)
        );
      });

      setFollowingStates(initialStates);
    } catch (err) {
      console.error("Suggested users error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load suggested users."
      );
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchSuggestedUsers();
  }, [fetchSuggestedUsers]);


  const handleFollow = async (suggestedUserId) => {
    if (!suggestedUserId || followingUserId !== null) return;

    if (String(suggestedUserId) === String(user?._id)) return;

    const currentlyFollowing = Boolean(
      followingStates[suggestedUserId]
    );

    try {
      setFollowingUserId(suggestedUserId);

      const response = await followOrUnfollow(suggestedUserId);
      const data = response?.data ?? response;

      if (!data?.success) {
        throw new Error(
          data?.message || "Failed to update follow status."
        );
      }

      const nowFollowing =
        typeof data.isFollowing === "boolean"
          ? data.isFollowing
          : !currentlyFollowing;

      // Update only the button state. Keep the user visible.
      setFollowingStates((previous) => ({
        ...previous,
        [suggestedUserId]: nowFollowing,
      }));

      toast.success(data.message);
    } catch (err) {
      console.error("Follow user error:", err);

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to update follow status."
      );
    } finally {
      setFollowingUserId(null);
    }
  };


  const visibleUsers = showAll ? suggestedUsers : suggestedUsers.slice(0, PREVIEW_LIMIT);

  // Loading state
  if (loading) {
    return (
      <section className="my-6 w-full">
        <h2 className="mb-4 text-base font-semibold">
          Suggested for you
        </h2>

        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3"
            >
              <div className="size-10 animate-pulse rounded-full bg-muted" />

              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="my-6 w-full">
        <h2 className="mb-4 text-base font-semibold">
          Suggested for you
        </h2>

        <p className="text-sm text-destructive">{error}</p>

        <Button
          type="button"
          variant="link"
          onClick={fetchSuggestedUsers}
          className="mt-2 h-auto px-0 text-[#FF4D00]"
        >
          Try again
        </Button>
      </section>
    );
  }

  return (
    <section className="my-6 w-full">
      {/* Heading */}
      <div className="mb-4">
        <h2 className="text-base font-semibold tracking-tight text-[#1B1C20] dark:text-white">
          Suggested for you
        </h2>
      </div>

      {/* Users */}
      {suggestedUsers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E4E1DB] dark:border-[#262626] p-5 text-center">
          <Users className="mx-auto mb-2 size-6 text-muted-foreground" />

          <p className="text-sm font-medium text-[#1B1C20] dark:text-white">
            You're all caught up
          </p>

          <p className="mt-1 text-xs text-muted-foreground dark:text-neutral-400">
            No suggestions available right now.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {visibleUsers.map((suggestedUser) => {
              const id = suggestedUser._id;
              const isFollowing = Boolean(followingStates[id]);
              const isProcessing =
                String(followingUserId) === String(id);
              const username = suggestedUser.username;

              return (
                <div
                  key={id}
                  className="flex min-w-0 items-center gap-3"
                >
                  {/* Avatar */}
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${username}`)}
                    aria-label={`View @${suggestedUser.username}'s profile`}
                    className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00]"
                    >
                    <Avatar className="size-10">
                      <AvatarImage
                        src={
                          suggestedUser.profilePicture?.url || ""
                        }
                        alt={suggestedUser.username || "User"}
                        />

                      <AvatarFallback className="bg-orange-50 font-semibold text-[#FF4D00] dark:bg-[#2A180E]">
                        {suggestedUser.username
                          ?.charAt(0)
                          ?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  {/* Name and username */}
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${username}`)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-sm font-semibold text-[#1B1C20] dark:text-white hover:underline">
                      {suggestedUser.name ||
                        suggestedUser.username}
                    </span>

                    <span className="mt-0.5 block truncate text-xs text-muted-foreground dark:text-neutral-400">
                      @{suggestedUser.username || "user"}
                    </span>
                  </button>

                  {/* Follow / Following toggle */}
                  <Button
                    type="button"
                    variant={isFollowing ? "outline" : "ghost"}
                    size="sm"
                    disabled={followingUserId !== null}
                    onClick={() => handleFollow(id)}
                    className={`h-8 shrink-0 px-2 text-xs cursor-pointer font-semibold ${
                      isFollowing
                        ? "border-border text-foreground hover:bg-muted dark:border-[#333] dark:hover:bg-[#222]"
                        : "text-[#FF4D00] hover:bg-orange-100 dark:hover:bg-[#2A180E] hover:text-[#D9430A]"
                    }`}
                  >
                    {isProcessing ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : isFollowing ? (
                      "Following"
                    ) : (
                      "Follow"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* See all / Show less */}
          {suggestedUsers.length > PREVIEW_LIMIT && (
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setShowAll((previous) => !previous)
              }
              className="mt-5 h-auto w-full justify-start px-0 py-2 text-sm font-semibold text-[#FF4D00] hover:bg-transparent hover:text-[#D9430A]"
            >
              {showAll
                ? "Show less"
                : `See all (${suggestedUsers.length})`}
            </Button>
          )}
        </>
      )}
    </section>
  );
};

export default SuggestedUser;