import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  Image as ImageIcon,
  MessageCircle,
  Heart,
  Play,
} from "lucide-react";
import { toast } from "sonner";

import {
  getBookmarkedPosts,
  toggleBookmark,
} from "@/services/postService";
import { useAuth } from "@/context/AuthContext";
import CommentDialog from "@/components/post/CommentDialog";

const getVideoThumbnail = (url) => {
  if (!url) return "";
  if (url.match(/\.(mp4|mov|webm|m4v)($|\?)/i)) {
    return url.replace(/\.(mp4|mov|webm|m4v)(\?.*)?$/i, ".jpg$2");
  }
  return url;
};

const Bookmarks = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const [selectedPost, setSelectedPost] = useState(null);
  const [openComment, setOpenComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const fetchBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getBookmarkedPosts();

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to load bookmarks."
        );
      }

      setPosts(response.posts || []);
    } catch (err) {
      console.error("Fetch bookmarks error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load bookmarks."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handlePostClick = (post) => {
    if (!post?._id) return;
    setSelectedPost(post);
    const currentUserId = currentUser?._id;
    const userLiked = post.likes?.some(
      (l) => (typeof l === "object" ? l?._id : l) === currentUserId,
    );
    setIsLiked(Boolean(userLiked));
    setLikeCount(post.likes?.length ?? post.likeCount ?? 0);
    setOpenComment(true);
  };

  const handleRemoveBookmark = async (event, post) => {
    event.stopPropagation();

    if (!post?._id || removingId) return;

    try {
      setRemovingId(post._id);

      const response = await toggleBookmark(post._id);

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to remove bookmark."
        );
      }

      setPosts((currentPosts) =>
        currentPosts.filter(
          (item) => String(item._id) !== String(post._id)
        )
      );

      toast.success("Removed from bookmarks");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to remove bookmark."
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F6F3] px-4 py-6 sm:px-6 lg:px-8 dark:bg-black">
      <div className="mx-auto w-full max-w-5xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#686A72] transition hover:bg-white hover:text-[#1B1C20] dark:text-neutral-400 dark:hover:bg-[#181818] dark:hover:text-white"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <header className="mb-7">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#FFF0E8] dark:bg-[#2A180E]">
              <Bookmark
                size={22}
                className="text-[#FF4D00]"
              />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#1B1C20] dark:text-white">
                Bookmarks
              </h1>
              <p className="mt-1 text-sm text-[#686A72] dark:text-neutral-400">
                Posts you've saved for later.
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square animate-pulse rounded-xl bg-white dark:bg-[#181818]"
              />
            ))}
          </div>
        ) : error ? (
          <p className="py-10 text-center text-sm text-[#686A72] dark:text-neutral-400">
            {error}{" "}
            <button
              type="button"
              onClick={fetchBookmarks}
              className="font-medium text-[#FF4D00] hover:underline"
            >
              Try again
            </button>
          </p>
        ) : posts.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-[#E4E1DB] bg-white px-6 text-center dark:border-[#333333] dark:bg-[#121212]">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#FFF0E8] dark:bg-[#2A180E]">
              <Bookmark
                size={26}
                className="text-[#FF4D00]"
              />
            </div>

            <h2 className="text-lg font-semibold text-[#1B1C20] dark:text-white">
              No saved posts yet
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#686A72] dark:text-neutral-400">
              Save posts you want to revisit, and they'll be collected here.
            </p>

            <button
              type="button"
              onClick={() => navigate("/home")}
              className="mt-5 rounded-full bg-[#FF4D00] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#E64400]"
            >
              Discover posts
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-[#686A72] dark:text-neutral-400">
                {posts.length} saved {posts.length === 1 ? "post" : "posts"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              {posts.map((post) => {
                const isVideo =
                  post.mediaType === "video" ||
                  Boolean(post.image?.url?.match(/\.(mp4|mov|webm|m4v)($|\?)/i));
                const thumbnailUrl = isVideo
                  ? getVideoThumbnail(post.image?.url)
                  : post.image?.url;

                return (
                  <button
                    key={post._id}
                    type="button"
                    onClick={() => handlePostClick(post)}
                    aria-label={`Open post by @${post.author?.username || "user"}`}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-[#EEECE8] dark:bg-[#1A1A1A] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF4D00]"
                  >
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={post.caption || "Saved post"}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon
                          size={26}
                          className="text-[#9A9CA3]"
                        />
                      </div>
                    )}

                    {/* Video Play indicator */}
                    {isVideo && (
                      <span
                        aria-label="Video post"
                        className="absolute top-2 right-2 z-10 flex size-6 sm:size-7 items-center justify-center rounded-full bg-black/60 text-white shadow-sm backdrop-blur"
                      >
                        <Play
                          size={12}
                          className="fill-white text-white translate-x-[1px]"
                        />
                      </span>
                    )}

                    {/* Author avatar & username */}
                    {post.author && (
                      <div className="absolute top-2 left-2 z-10 flex max-w-[calc(100%-40px)] items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                        {post.author.profilePicture?.url ||
                        (typeof post.author.profilePicture === "string" &&
                          post.author.profilePicture) ? (
                          <img
                            src={
                              post.author.profilePicture?.url ||
                              post.author.profilePicture
                            }
                            alt={post.author.username || "author"}
                            className="size-4 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#FF4D00] text-[9px] font-bold text-white">
                            {(post.author.username || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <span className="truncate text-xs font-medium text-white">
                          {post.author.username}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/65 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-sm:opacity-100">
                      <div className="flex items-center gap-3 text-sm font-semibold text-white">
                        <span className="flex items-center gap-1">
                          <Heart size={16} />
                          {post.likes?.length || 0}
                        </span>

                        <span className="flex items-center gap-1">
                          <MessageCircle size={16} />
                          {post.comments?.length || 0}
                        </span>
                      </div>

                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Remove bookmark"
                        onClick={(event) =>
                          handleRemoveBookmark(event, post)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            handleRemoveBookmark(event, post);
                          }
                        }}
                        className="flex size-8 items-center justify-center rounded-full bg-white/95 dark:bg-[#262626] text-[#FF4D00] shadow-sm transition hover:bg-white dark:hover:bg-[#333333]"
                      >
                        {removingId === post._id ? (
                          <span className="size-4 animate-spin rounded-full border-2 border-[#FF4D00] border-t-transparent" />
                        ) : (
                          <Bookmark
                            size={17}
                            fill="currentColor"
                          />
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Reusable Comment Dialog */}
      {selectedPost && (
        <CommentDialog
          openComment={openComment}
          setOpenComment={setOpenComment}
          post={selectedPost}
          isLiked={isLiked}
          likeCount={likeCount}
          onLikeChange={(newIsLiked, newCount) => {
            setIsLiked(newIsLiked);
            setLikeCount(newCount);
            setPosts((current) =>
              current.map((p) =>
                p._id === selectedPost._id
                  ? {
                      ...p,
                      likeCount: newCount,
                      likes: newIsLiked
                        ? [...(p.likes || []), currentUser?._id]
                        : (p.likes || []).filter(
                            (id) =>
                              (typeof id === "object" ? id?._id : id) !==
                              currentUser?._id,
                          ),
                    }
                  : p,
              ),
            );
          }}
          onCommentAdded={() => {
            setPosts((current) =>
              current.map((p) =>
                p._id === selectedPost._id
                  ? {
                      ...p,
                      comments: [...(p.comments || []), {}],
                    }
                  : p,
              ),
            );
          }}
        />
      )}
    </main>
  );
};

export default Bookmarks;
