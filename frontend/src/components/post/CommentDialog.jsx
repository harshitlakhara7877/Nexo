import { useEffect, useState, useRef } from "react";
import { Bookmark, Heart, MoreHorizontal, Send, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { useAuth } from "@/context/AuthContext";
import {
  addComment,
  getComments,
  likePost,
  dislikePost,
  toggleBookmark,
  deletePost,
} from "@/services/postService";
import { followOrUnfollow } from "@/services/userService";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import SharePostDialog from "./SharePostDialog";

const CommentDialog = ({
  openComment,
  setOpenComment,
  post,
  isLiked,
  likeCount,
  onLikeChange,
  onCommentAdded,
}) => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const author = post?.author;
  const authorId = String(author?._id || author || "");
  const isOwnPost = String(user?._id || "") === authorId;

  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [likeLoading, setLikeLoading] = useState(false);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [moreDialogOpen, setMoreDialogOpen] = useState(false);

  const [expandedComments, setExpandedComments] = useState({});
  const [shareOpen, setShareOpen] = useState(false);
  const postUrl = post?._id ? `${window.location.origin}/post/${post._id}` : "";

  // Video autoplay state
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playPauseIndicator, setPlayPauseIndicator] = useState(null);

  // Initialize bookmark status
  useEffect(() => {
    if (!post) return;
    if (typeof post.isBookmarked === "boolean") {
      setIsBookmarked(post.isBookmarked);
    } else if (user?.bookmarks) {
      const bookmarked = user.bookmarks.some(
        (b) => String(typeof b === "object" ? b?._id : b) === String(post._id)
      );
      setIsBookmarked(bookmarked);
    }
  }, [post, user]);

  // Initialize follow status
  useEffect(() => {
    if (!authorId || !user) return;
    const followingList = user.following || [];
    const following = followingList.some(
      (f) => String(typeof f === "object" ? f?._id : f) === authorId
    );
    setIsFollowing(following);
  }, [authorId, user]);

  const handleBookmark = async (e) => {
    if (e) e.stopPropagation();
    if (!post?._id || bookmarkLoading) return;
    const prev = isBookmarked;
    setIsBookmarked(!prev);
    try {
      setBookmarkLoading(true);
      const res = await toggleBookmark(post._id);
      if (res?.success) {
        setIsBookmarked(Boolean(res.isBookmarked));
        toast.success(
          res.isBookmarked
            ? "Post saved to bookmarks"
            : "Removed from bookmarks"
        );
      }
    } catch (err) {
      setIsBookmarked(prev);
      toast.error(err.response?.data?.message || "Failed to update bookmark");
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!authorId || followLoading || isOwnPost) return;
    try {
      setFollowLoading(true);
      const res = await followOrUnfollow(authorId);
      if (res?.success) {
        const nextState = !isFollowing;
        setIsFollowing(nextState);
        toast.success(
          nextState
            ? `Following @${author?.username || "user"}`
            : `Unfollowed @${author?.username || "user"}`
        );
        if (setUser) {
          setUser((prev) => {
            if (!prev) return prev;
            const cur = prev.following || [];
            const updated = nextState
              ? [...cur, authorId]
              : cur.filter(
                  (id) =>
                    String(typeof id === "object" ? id?._id : id) !== authorId
                );
            return { ...prev, following: updated };
          });
        }
        setMoreDialogOpen(false);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update follow status"
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post?._id || !isOwnPost) return;
    try {
      await deletePost(post._id);
      toast.success("Post deleted");
      setMoreDialogOpen(false);
      setOpenComment(false);
      window.location.reload();
    } catch (err) {
      toast.error("Failed to delete post");
    }
  };
  // ================= FETCH COMMENTS =================

  useEffect(() => {
    if (!openComment || !post?._id) return;

    const fetchComments = async () => {
      try {
        setCommentsLoading(true);

        const response = await getComments(post._id);

        if (!response?.success) {
          throw new Error(response?.message || "Failed to fetch comments");
        }

        setComments(response.comments || []);
      } catch (error) {
        console.error("Get comments error:", error);

        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Failed to load comments",
        );
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [openComment, post?._id]);

  const handleProfileClick = (event, username) => {
    event.stopPropagation();

    if (!username) return;

    navigate(`/profile/${username}`);
  };

  // ================= LIKE =================

  const handleLike = async () => {
    if (likeLoading || !post?._id) return;

    try {
      setLikeLoading(true);

      const response = isLiked
        ? await dislikePost(post._id)
        : await likePost(post._id);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update like");
      }

      onLikeChange?.(response.isLiked, response.likeCount);
    } catch (error) {
      console.error("Comment dialog like error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update like",
      );
    } finally {
      setLikeLoading(false);
    }
  };
  // ================= ADD COMMENT =================

  const handleAddComment = async () => {
    const text = commentText.trim();

    if (!text || commentLoading || !post?._id) {
      return;
    }

    if (text.length > 500) {
      toast.error("Comment must be 500 characters or less");
      return;
    }

    try {
      setCommentLoading(true);

      const response = await addComment(post._id, text);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to add comment");
      }

      // Add the new comment immediately
      setComments((previousComments) => [
        response.comment,
        ...previousComments,
      ]);

      setCommentText("");

      onCommentAdded?.();

      toast.success("Comment added");
    } catch (error) {
      console.error("Add comment error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to add comment",
      );
    } finally {
      setCommentLoading(false);
    }
  };

  const isVideo = Boolean(
    post?.mediaType === "video" ||
      post?.image?.url?.match(/\.(mp4|mov|webm|m4v)($|\?)/i)
  );

  // Autoplay video when dialog opens, pause when closed
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    if (!openComment) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    video.muted = false;
    const attemptPlay = async () => {
      try {
        await video.play();
        setIsPlaying(true);
        setIsMuted(false);
      } catch {
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
    attemptPlay();

    return () => {
      video.pause();
    };
  }, [openComment, isVideo, post?.image?.url]);

  // Sync muted state
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  const flashIndicator = (type) => {
    setPlayPauseIndicator(type);
    setTimeout(() => setPlayPauseIndicator(null), 600);
  };

  const togglePlayPause = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    // Unmute on first user interaction if browser forced mute
    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
    }
    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        flashIndicator("play");
      }).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      flashIndicator("pause");
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const next = !isMuted;
    if (videoRef.current) videoRef.current.muted = next;
    setIsMuted(next);
  };

  return (
    <Dialog open={openComment} onOpenChange={setOpenComment}>
      <DialogContent
        className="max-w-4xl sm:max-w-5xl overflow-hidden p-0 dark:border-[#262626] dark:bg-[#121212]"
        showCloseButton={false}
      >
        <div className="flex h-[650px]">
          {/* ================= POST MEDIA (IMAGE OR VIDEO) ================= */}

          <div className="hidden w-1/2 bg-black md:flex md:items-center md:justify-center relative">
            {post?.image?.url && (
              isVideo ? (
                <>
                  <video
                    ref={videoRef}
                    src={post.image.url}
                    loop
                    playsInline
                    muted={isMuted}
                    onClick={togglePlayPause}
                    className="h-full w-full object-contain cursor-pointer"
                  />

                  {/* Play/Pause indicator */}
                  {playPauseIndicator && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="flex size-16 items-center justify-center rounded-full bg-black/50 text-white animate-ping-once">
                        {playPauseIndicator === "play" ? <Play size={28} fill="white" /> : <Pause size={28} fill="white" />}
                      </div>
                    </div>
                  )}

                  {/* Mute / Play controls */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause size={15} fill="white" /> : <Play size={15} fill="white" />}
                    </button>
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                  </div>
                </>
              ) : (
                <img
                  src={post.image.url}
                  alt={post?.caption || "Post image"}
                  className="h-full w-full object-cover"
                />
              )
            )}
          </div>

          {/* ================= RIGHT SIDE ================= */}

          <div className="flex w-full flex-col md:w-1/2 dark:bg-[#121212]">
            {/* HEADER */}

            <div className="mb-4 flex p-2 mr-2 items-center justify-between border-b border-transparent dark:border-[#262626]">
              <button
                type="button"
                onClick={(e) => handleProfileClick(e, author?.username)}
                className="flex cursor-pointer items-center gap-3 text-left"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={author?.profilePicture?.url}
                    alt={author?.username || "User"}
                    className="aspect-square object-cover"
                  />

                  <AvatarFallback className="dark:bg-[#2A180E] dark:text-[#FF4D00]">
                    {author?.username?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="text-sm font-semibold text-[#1B1C20] dark:text-white">
                    @{author?.username || "User"}
                  </p>
                </div>
              </button>

              {/* ================= MORE ================= */}

              <Dialog open={moreDialogOpen} onOpenChange={setMoreDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    aria-label="More options"
                    className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <MoreHorizontal
                      size={21}
                      className="text-[#1B1C20] dark:text-white"
                    />
                  </button>
                </DialogTrigger>

                <DialogContent
                  showCloseButton={false}
                  className="flex flex-col items-center text-center text-sm dark:bg-[#181818] dark:border-[#262626] p-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  {!isOwnPost && (
                    <Button
                      variant="ghost"
                      disabled={followLoading}
                      onClick={handleFollowToggle}
                      className={`w-full cursor-pointer font-bold ${
                        isFollowing
                          ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          : "text-[#FF4D00] hover:text-[#E64400] hover:bg-orange-50 dark:hover:bg-orange-950/20"
                      }`}
                    >
                      {followLoading
                        ? "Updating..."
                        : isFollowing
                        ? "Unfollow"
                        : "Follow"}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={handleBookmark}
                    className="w-full cursor-pointer font-medium text-[#1B1C20] dark:text-white"
                  >
                    {isBookmarked
                      ? "Remove from bookmarks"
                      : "Add to bookmarks"}
                  </Button>

                  {isOwnPost && (
                    <Button
                      variant="ghost"
                      onClick={handleDeletePost}
                      className="w-full cursor-pointer font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      Delete
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => setMoreDialogOpen(false)}
                    className="w-full cursor-pointer text-[#85858D] dark:text-neutral-400"
                  >
                    Cancel
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
            {/* COMMENTS */}

            <div className="flex-1 overflow-y-auto p-4">
              {/* Optional Post Caption with read more toggle */}
              {post?.caption && (
                <div className="mb-4 flex gap-3 pb-3 border-b border-[#EEECE8] dark:border-[#262626]">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage
                      src={author?.profilePicture?.url}
                      alt={author?.username || "User"}
                      className="aspect-square object-cover"
                    />
                    <AvatarFallback className="dark:bg-[#2A180E] dark:text-[#FF4D00]">
                      {author?.username?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1B1C20] dark:text-white mb-0.5">
                      @{author?.username || "User"}
                    </p>
                    <p className="text-sm text-[#1B1C20] dark:text-neutral-200 break-words whitespace-pre-wrap">
                      {post.caption.length > 20 && !expandedComments["caption"]
                        ? `${post.caption.slice(0, 20)}...`
                        : post.caption}
                    </p>
                    {post.caption.length > 20 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedComments((prev) => ({
                            ...prev,
                            caption: !prev.caption,
                          }));
                        }}
                        className="mt-0.5 text-xs font-semibold text-[#FF4D00] hover:underline cursor-pointer"
                      >
                        {expandedComments["caption"] ? "less" : "read more"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {commentsLoading ? (
                <p className="text-center text-sm text-[#686A72] dark:text-neutral-400">
                  Loading comments...
                </p>
              ) : comments.length === 0 ? (
                <p className="text-center text-sm text-[#686A72] dark:text-neutral-400">
                  No comments yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => {
                    const text = comment.text || "";
                    const isLong = text.length > 20;
                    const isExpanded = expandedComments[comment._id];

                    return (
                      <div key={comment._id} className="flex gap-3">
                        <Avatar className="h-9 w-9 cursor-pointer shrink-0">
                          <AvatarImage
                            src={comment?.author?.profilePicture?.url}
                            alt={comment?.author?.username || "User"}
                            onClick={(e) =>
                              handleProfileClick(e, comment?.author?.username)
                            }
                          />

                          <AvatarFallback className="dark:bg-[#2A180E] dark:text-[#FF4D00]">
                            {comment?.author?.username
                              ?.charAt(0)
                              ?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-[#1B1C20] dark:text-neutral-200 break-words whitespace-pre-wrap">
                            <span
                              onClick={(e) =>
                                handleProfileClick(e, comment?.author?.username)
                              }
                              className="font-semibold mr-1.5 cursor-pointer hover:underline text-[#1B1C20] dark:text-white"
                            >
                              @{comment?.author?.username || "user"}
                            </span>
                            {isLong && !isExpanded
                              ? `${text.slice(0, 20)}...`
                              : text}
                          </p>

                          {isLong && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setExpandedComments((previous) => ({
                                  ...previous,
                                  [comment._id]: !previous[comment._id],
                                }));
                              }}
                              className="mt-0.5 text-xs font-semibold text-[#FF4D00] hover:underline cursor-pointer"
                            >
                              {isExpanded ? "less" : "read more"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ACTIONS */}

            <div className="border-t flex justify-between border-[#E4E1DB] dark:border-[#262626] px-4 py-2">
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  disabled={likeLoading}
                  onClick={handleLike}
                  className="flex items-center gap-1 text-[#1B1C20] dark:text-white"
                >
                  <Heart
                    size={22}
                    className={
                      isLiked
                        ? "fill-[#FF4D00] text-[#FF4D00]"
                        : "text-[#1B1C20] dark:text-white"
                    }
                  />

                  <span className="text-sm">{likeCount}</span>
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShareOpen(true);
                  }}
                  aria-label="Share post"
                  className="flex items-center cursor-pointer transition hover:opacity-80 text-[#1B1C20] dark:text-white"
                >
                  <Send size={21} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                title={isBookmarked ? "Remove bookmark" : "Save post"}
                className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#F7F6F3] dark:hover:bg-[#1E1E1E] text-[#1B1C20] dark:text-white"
              >
                <Bookmark
                  size={21}
                  className={
                    isBookmarked
                      ? "fill-[#FF4D00] text-[#FF4D00]"
                      : "text-[#1B1C20] dark:text-white"
                  }
                />
              </button>
            </div>

            {/* ADD COMMENT */}

            <div className="border-t border-[#E4E1DB] dark:border-[#262626] p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  maxLength={500}
                  disabled={commentLoading}
                  onChange={(event) => setCommentText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleAddComment();
                    }
                  }}
                  placeholder="Add a comment..."
                  className="min-w-0 flex-1 rounded border border-[#E4E1DB] dark:border-[#262626] bg-[#F7F6F3] dark:bg-[#181818] px-4 py-2 text-sm text-[#1B1C20] dark:text-white outline-none placeholder:text-[#9A9CA3] dark:placeholder:text-neutral-500 focus:border-[#FF4D00]"
                />

                <button
                  type="button"
                  disabled={!commentText.trim() || commentLoading}
                  onClick={handleAddComment}
                  className="px-2 text-sm font-semibold text-[#FF4D00] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {commentLoading ? "..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      <SharePostDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        postUrl={postUrl}
        postCaption={post?.caption || ""}
        postId={post?._id}
      />
    </Dialog>
  );
};

export default CommentDialog;



