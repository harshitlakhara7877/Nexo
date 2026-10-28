import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  Bookmark,
  MoreHorizontal,
  UserRound,
  Volume2,
  VolumeX,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import {
  getFeed,
  likePost,
  dislikePost,
  toggleBookmark,
  deletePost,
} from "@/services/postService";
import { reportUser } from "@/services/messageService";

import CommentDialog from "@/components/post/CommentDialog";
import SharePostDialog from "@/components/post/SharePostDialog";
import ReportDialog from "@/components/message/ReportDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const getId = (value) => {
  if (!value) return "";
  return String(
    typeof value === "object" ? value._id || value.id || "" : value
  );
};

/* Individual full-screen post */
function ExplorePost({ post, user }) {
  const navigate = useNavigate();
  const [openComment, setOpenComment] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const author = post?.author;
  const postId = getId(post?._id);
  const authorId = getId(author?._id);
  const currentUserId = getId(user?._id);

  const isOwnPost = Boolean(
    currentUserId && authorId && currentUserId === authorId
  );

  const [isLiked, setIsLiked] = useState(
    Boolean(
      post?.isLiked ||
        post?.likes?.some((like) => getId(like) === currentUserId)
    )
  );

  const [likeCount, setLikeCount] = useState(
    post?.likeCount ?? post?.likes?.length ?? 0
  );

  const [commentCount, setCommentCount] = useState(
    post?.comments?.length ?? 0
  );

  const [isFollowing, setIsFollowing] = useState(
    Boolean(
      user?.following?.some((item) => getId(item) === authorId) ||
        author?.followers?.some((item) => getId(item) === currentUserId)
    )
  );

  const [isBookmarked, setIsBookmarked] = useState(
    Boolean(user?.bookmarks?.some((item) => getId(item) === postId))
  );

  const [likeLoading, setLikeLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const profileImage = author?.profilePicture?.url;

  const isVideo = Boolean(
    post?.mediaType === "video" ||
      post?.image?.url?.match(/\.(mp4|mov|webm|m4v)($|\?)/i)
  );
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playPauseIndicator, setPlayPauseIndicator] = useState(null);
  const [expandedCaption, setExpandedCaption] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    video.muted = isMuted;

    const playVideo = async () => {
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        // Autoplay with audio was rejected by browser policy
        video.muted = true;
        setIsMuted(true);
        try {
          await video.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      }
    };

    playVideo();
  }, [post?.image?.url, isVideo]);

  // Turn off autoplay on the background reel when comment dialog is open
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    if (openComment) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [openComment, isVideo]);

  const flashIndicator = (type) => {
    setPlayPauseIndicator(type);
    setTimeout(() => setPlayPauseIndicator(null), 600);
  };

  const togglePlayPause = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          flashIndicator("play");
        })
        .catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      flashIndicator("pause");
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleProfileClick = () => {
    if (author?.username) {
      navigate(`/profile/${author.username}`);
    }
  };

  // LIKE / DISLIKE with optimistic update & rollback
  const handleLike = async () => {
    if (!postId || likeLoading) return;

    const prevLiked = isLiked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));

    setIsLiked(nextLiked);
    setLikeCount(nextCount);
    setLikeLoading(true);

    try {
      const response = nextLiked
        ? await likePost(postId)
        : await dislikePost(postId);

      if (!response?.success) {
        throw new Error(response?.message || "Unable to update like.");
      }

      if (typeof response.likeCount === "number") {
        setLikeCount(response.likeCount);
      }
    } catch (error) {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update like."
      );
    } finally {
      setLikeLoading(false);
    }
  };

  // FOLLOW / UNFOLLOW
  const handleFollow = async () => {
    if (!authorId || isOwnPost || followLoading) return;

    try {
      setFollowLoading(true);
      const response = await api.post(`/user/follow/${authorId}`);

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Unable to update follow.");
      }

      setIsFollowing((previous) => !previous);
      toast.success(isFollowing ? "Unfollowed successfully" : "Following user");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update follow."
      );
    } finally {
      setFollowLoading(false);
    }
  };

  // COMMENTS
  const handleCommentAdded = () => {
    setCommentCount((count) => count + 1);
  };

  // BOOKMARK with optimistic update & rollback
  const handleBookmark = async () => {
    if (!postId || bookmarkLoading) return;

    const prevBookmarked = isBookmarked;
    setIsBookmarked(!prevBookmarked);
    setBookmarkLoading(true);

    try {
      const response = await toggleBookmark(postId);
      if (!response?.success) {
        throw new Error(response?.message || "Unable to update bookmark.");
      }

      setIsBookmarked(Boolean(response.isBookmarked));
      toast.success(
        response.isBookmarked ? "Post saved" : "Removed from bookmarks"
      );
    } catch (error) {
      setIsBookmarked(prevBookmarked);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update bookmark."
      );
    } finally {
      setBookmarkLoading(false);
    }
  };

  // COPY LINK
  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
    setMoreOpen(false);
  };

  // DELETE POST (if own post)
  const handleDeletePost = async () => {
    setMoreOpen(false);
    try {
      await deletePost(postId);
      toast.success("Post deleted");
      window.location.reload();
    } catch (err) {
      toast.error("Failed to delete post");
    }
  };

  return (
    <>
      <section
        className="relative h-[100dvh] min-h-[100dvh] w-full snap-start snap-always overflow-hidden bg-white dark:bg-black"
        aria-label={`Post by @${author?.username || "user"}`}
      >
        {/* Full-height portrait media, centered in viewport */}
        <article
          className="absolute inset-y-0 left-1/2 h-full -translate-x-1/2 overflow-hidden bg-[#F7F6F3] dark:bg-black"
          style={{
            aspectRatio: "9 / 16",
            width: "auto",
            maxWidth: "min(56.25dvh, 78vw)",
          }}
        >
          {isVideo ? (
            <div
              className="relative h-full w-full cursor-pointer select-none"
              onClick={togglePlayPause}
            >
              <video
                ref={videoRef}
                src={post?.image?.url}
                loop
                playsInline
                className="h-full w-full object-cover pointer-events-none"
              />

              {/* Mute / Unmute Button */}
              <button
                type="button"
                onClick={toggleMute}
                className="absolute top-4 right-4 z-20 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              {/* Centered Play/Pause flash animation */}
              {playPauseIndicator && (
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                  <div className="animate-[ping_0.5s_ease-out_forwards] rounded-full bg-black/60 p-4 backdrop-blur">
                    {playPauseIndicator === "pause" ? (
                      <Pause size={40} className="text-white fill-white" />
                    ) : (
                      <Play size={40} className="text-white fill-white ml-0.5" />
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate(`/post/${postId}`)}
              className="block h-full w-full cursor-pointer"
              aria-label={`Open post by @${author?.username || "user"}`}
            >
              {post?.image?.url ? (
                <img
                  src={post.image.url}
                  alt={post.caption || `Post by @${author?.username || "user"}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-sm text-[#686A72] dark:text-neutral-400">
                  Image unavailable
                </span>
              )}
            </button>
          )}
        </article>

        {/* Author details: outside the image, bottom-left */}
        <aside
          className="absolute bottom-7 left-4 z-10 hidden w-[min(220px,22vw)] flex-col gap-3 lg:flex"
          style={{
            left: "max(20px, calc(50% - 28.125dvh - 244px))",
          }}
        >
          <button
            type="button"
            onClick={handleProfileClick}
            className="flex w-fit items-center gap-3 text-left"
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt={author?.username || "User"}
                className="h-11 w-11 rounded-full border border-[#E4E1DB] dark:border-[#262626] object-cover"
              />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F7F6F3] dark:bg-[#202020]">
                <UserRound size={20} className="text-[#1B1C20] dark:text-white" />
              </span>
            )}

            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#1B1C20] dark:text-white">
                @{author?.username || "user"}
              </span>
              {author?.name && (
                <span className="block truncate text-xs text-[#686A72] dark:text-neutral-400">
                  {author.name}
                </span>
              )}
            </span>
          </button>

          {!isOwnPost && (
            <button
              type="button"
              onClick={handleFollow}
              disabled={followLoading}
              className={`w-fit rounded-full px-4 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                isFollowing
                  ? "border border-[#E4E1DB] dark:border-[#262626] text-[#1B1C20] dark:text-white hover:bg-[#F7F6F3] dark:hover:bg-[#1E1E1E]"
                  : "bg-[#FF4D00] text-white hover:bg-[#e94600]"
              }`}
            >
              {followLoading
                ? "Please wait..."
                : isFollowing
                  ? "Following"
                  : "Follow"}
            </button>
          )}

          {post.caption && (
            <div>
              <p className="whitespace-pre-wrap break-words text-sm leading-5 text-[#686A72] dark:text-neutral-300 [overflow-wrap:anywhere]">
                {post.caption.length > 20 && !expandedCaption
                  ? `${post.caption.slice(0, 20)}...`
                  : post.caption}
              </p>
              {post.caption.length > 20 && (
                <button
                  type="button"
                  onClick={() => setExpandedCaption((prev) => !prev)}
                  className="mt-0.5 text-xs font-semibold text-[#FF4D00] hover:underline cursor-pointer"
                >
                  {expandedCaption ? "less" : "read more"}
                </button>
              )}
            </div>
          )}

          {post.createdAt && (
            <p className="text-xs text-[#9A9CA3] dark:text-neutral-500">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          )}
        </aside>

        {/* Vertical actions: outside and close to the media */}
        <aside
          className="absolute top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-5"
          style={{
            left: "calc(50% + 28.125dvh + 14px)",
          }}
        >
          <button
            type="button"
            onClick={handleLike}
            disabled={likeLoading}
            title="Like"
            aria-label={isLiked ? "Unlike post" : "Like post"}
            className="flex flex-col items-center gap-1 text-[#1B1C20] dark:text-white transition hover:text-[#FF4D00] disabled:opacity-50"
          >
            <Heart
              size={25}
              className={isLiked ? "fill-[#FF4D00] text-[#FF4D00]" : ""}
            />
            <span className="text-xs">{likeCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setOpenComment(true)}
            title="Comments"
            aria-label="Open comments"
            className="flex flex-col items-center gap-1 text-[#1B1C20] dark:text-white transition hover:text-[#FF4D00]"
          >
            <MessageCircle size={24} />
            <span className="text-xs">{commentCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setShareOpen(true)}
            title="Repost or share"
            aria-label="Repost or share"
            className="text-[#1B1C20] dark:text-white transition hover:text-[#FF4D00]"
          >
            <Repeat2 size={23} />
          </button>

          <button
            type="button"
            onClick={() => setShareOpen(true)}
            title="Send"
            aria-label="Send post"
            className="text-[#1B1C20] dark:text-white transition hover:text-[#FF4D00]"
          >
            <Send size={23} />
          </button>

          <button
            type="button"
            onClick={handleBookmark}
            disabled={bookmarkLoading}
            title="Bookmark"
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark post"}
            className={`transition disabled:opacity-50 ${
              isBookmarked
                ? "text-[#FF4D00]"
                : "text-[#1B1C20] dark:text-white hover:text-[#FF4D00]"
            }`}
          >
            <Bookmark
              size={23}
              fill={isBookmarked ? "currentColor" : "none"}
            />
          </button>

          {/* Three-dot More menu trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMoreOpen(true);
            }}
            title="More options"
            aria-label="More post options"
            className="text-[#1B1C20] dark:text-white transition hover:text-[#FF4D00]"
          >
            <MoreHorizontal size={25} />
          </button>
        </aside>

        {/* Small-screen author information */}
        <div className="absolute bottom-4 left-3 z-10 flex max-w-[35vw] items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={handleProfileClick}
            className="truncate text-left text-xs font-semibold text-[#1B1C20] dark:text-white"
          >
            @{author?.username || "user"}
          </button>

          {!isOwnPost && (
            <button
              type="button"
              onClick={handleFollow}
              disabled={followLoading}
              className="rounded-full bg-[#FF4D00] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </section>

      {/* Three-dot More Menu Dialog */}
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex max-w-[300px] flex-col items-center gap-0 overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white p-0 text-center text-sm shadow-2xl dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              setReportOpen(true);
            }}
            className="w-full border-b border-[#E4E1DB] py-3.5 font-bold text-red-500 transition hover:bg-black/5 dark:border-[#262626] dark:hover:bg-white/5"
          >
            Report
          </button>

          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              handleBookmark();
            }}
            className="w-full border-b border-[#E4E1DB] py-3.5 font-medium transition hover:bg-black/5 dark:border-[#262626] dark:hover:bg-white/5"
          >
            {isBookmarked ? "Remove bookmark" : "Bookmark"}
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full border-b border-[#E4E1DB] py-3.5 font-medium transition hover:bg-black/5 dark:border-[#262626] dark:hover:bg-white/5"
          >
            Copy link
          </button>

          {!isOwnPost && isFollowing && (
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                handleFollow();
              }}
              className="w-full border-b border-[#E4E1DB] py-3.5 font-bold text-red-500 transition hover:bg-black/5 dark:border-[#262626] dark:hover:bg-white/5"
            >
              Unfollow
            </button>
          )}

          {isOwnPost && (
            <button
              type="button"
              onClick={handleDeletePost}
              className="w-full border-b border-[#E4E1DB] py-3.5 font-bold text-red-500 transition hover:bg-black/5 dark:border-[#262626] dark:hover:bg-white/5"
            >
              Delete
            </button>
          )}

          <button
            type="button"
            onClick={() => setMoreOpen(false)}
            className="w-full py-3.5 font-normal text-[#686A72] transition hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/5"
          >
            Cancel
          </button>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <CommentDialog
        openComment={openComment}
        setOpenComment={setOpenComment}
        post={post}
        onCommentAdded={handleCommentAdded}
      />

      {/* Share Dialog */}
      <SharePostDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        postUrl={`${window.location.origin}/post/${postId}`}
        postCaption={post?.caption || ""}
        postId={postId}
      />

      {/* Report Dialog */}
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        contact={author}
        onSubmit={async ({ reason, details }) => {
          try {
            const res = await reportUser(authorId, { reason, details });
            if (res?.success) {
              toast.success("Report submitted successfully. Thank you.");
            }
          } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit report.");
          }
        }}
      />
    </>
  );
}

export default function Explore() {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadFeed = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getFeed();

        if (!response?.success) {
          throw new Error(response?.message || "Unable to load your feed.");
        }

        if (!cancelled) {
          setPosts(response.posts || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load posts."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadFeed();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="flex h-[100dvh] items-center justify-center bg-white dark:bg-black">
        <p className="text-sm text-[#686A72] dark:text-neutral-400">Loading posts...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex h-[100dvh] items-center justify-center bg-white dark:bg-black px-6">
        <div className="text-center">
          <p className="mb-4 text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-[#FF4D00] px-5 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!posts.length) {
    return (
      <main className="flex h-[100dvh] items-center justify-center bg-white dark:bg-black px-6">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-[#1B1C20] dark:text-white">
            Nothing to explore yet
          </h2>
          <p className="text-sm text-[#686A72] dark:text-neutral-400">
            Posts will appear here when they are available in your feed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="h-[100dvh] w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth bg-white dark:bg-black"
      aria-label="Explore feed"
    >
      {posts.map((post) => (
        <ExplorePost key={post._id} post={post} user={user} />
      ))}
    </main>
  );
}
