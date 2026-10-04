import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/services/api";
import PostCard from "./PostCard";

export default function PostFeed() {
  const [posts, setPosts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const fetchPosts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/post/feed");

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to load feed"
        );
      }

      setPosts(response.data.posts || []);
    } catch (error) {
      console.error("Fetch feed error:", error);

      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to load feed";

      setError(message);

      // Important:
      // If posts already exist and refresh fails,
      // keep showing the old posts.
      if (isRefresh && posts.length > 0) {
        toast.error("Couldn't refresh the feed");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [posts.length]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-5">

        <FeedSkeleton />
        <FeedSkeleton />
      </div>
    );
  }



  if (error && posts.length === 0) {
    return (
      <FeedError
        message={error}
        onRetry={() => fetchPosts()}
      />
    );
  }

  /*
   * --------------------------------
   * LOADED FEED
   * --------------------------------
   */

  return (
    <section>

      {/* Refresh error while old posts remain visible */}
      {error && posts.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-[#E4E1DB] bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[#686A72]">
            <AlertCircle
              size={17}
              className="text-[#FF4D00]"
            />

            <span>
              Couldn't refresh your feed.
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchPosts(true)}
            disabled={refreshing}
            className="text-sm font-semibold text-[#FF4D00] hover:text-[#D9430A]"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 ? (
        <EmptyFeed />
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
            />
          ))}
        </div>
      )}
    </section>
  );
}



function FeedSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="h-10 w-10 animate-pulse rounded-full bg-[#EEECE8]" />

        <div className="space-y-2">
          <div className="h-3 w-28 animate-pulse rounded bg-[#EEECE8]" />
          <div className="h-2.5 w-20 animate-pulse rounded bg-[#EEECE8]" />
        </div>
      </div>

      {/* Image */}
      <div className="aspect-square w-full animate-pulse bg-[#EEECE8]" />

      {/* Actions */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex gap-3">
          <div className="h-5 w-5 animate-pulse rounded bg-[#EEECE8]" />
          <div className="h-5 w-5 animate-pulse rounded bg-[#EEECE8]" />
          <div className="h-5 w-5 animate-pulse rounded bg-[#EEECE8]" />
        </div>

        <div className="h-5 w-5 animate-pulse rounded bg-[#EEECE8]" />
      </div>

      {/* Text */}
      <div className="space-y-3 px-5 pb-5">
        <div className="h-3 w-20 animate-pulse rounded bg-[#EEECE8]" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-[#EEECE8]" />
      </div>
    </div>
  );
}

/*
 * --------------------------------
 * EMPTY STATE
 * --------------------------------
 */

function EmptyFeed() {
  return (
    <div className="rounded-2xl border border-[#E4E1DB] bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0E9] text-2xl">
        ✨
      </div>

      <h3 className="mt-4 text-lg font-semibold text-[#1B1C20]">
        No posts yet
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#686A72]">
        Your feed is empty right now. Create the first post
        and start sharing with the Nexo community.
      </p>
    </div>
  );
}

/*
 * --------------------------------
 * ERROR STATE
 * --------------------------------
 */

function FeedError({
  message,
  onRetry,
}) {
  return (
    <div className="rounded-2xl border border-[#E4E1DB] bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0E9]">
        <AlertCircle
          size={24}
          className="text-[#FF4D00]"
        />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-[#1B1C20]">
        Couldn't load your feed
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#686A72]">
        {message ||
          "Something went wrong while loading your posts."}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FF4D00] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#D9430A]"
      >
        <RefreshCw size={16} />
        Try again
      </button>
    </div>
  );
}