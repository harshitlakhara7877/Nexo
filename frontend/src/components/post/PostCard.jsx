import { useEffect, useState, useRef } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import CommentDialog from "./CommentDialog";
import { useNavigate } from "react-router-dom";
import {
  likePost,
  dislikePost,
  addComment,
  toggleBookmark,
  deletePost,
} from "@/services/postService";
import { reportUser } from "@/services/messageService";
import { followOrUnfollow } from "@/services/userService";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { useAuth } from "@/context/AuthContext";
import SharePostDialog from "./SharePostDialog";
import ReportDialog from "@/components/message/ReportDialog";

const PostCard = ({ post }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const author = post?.author;

  const [isLiked, setIsLiked] = useState(
    post?.likes?.some(
      (userId) => userId?.toString() === user?._id?.toString(),
    ) || false,
  );

  const [isBookmarked, setIsBookmarked] = useState(
    post?.bookmarks?.some(
      (userId) => userId?.toString() === user?._id?.toString(),
    ) || false,
  );

  const [likeCount, setLikeCount] = useState(post?.likes?.length || 0);

  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const [commentCount, setCommentCount] = useState(post?.comments?.length || 0);

  const [shareOpen, setShareOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const [openComment, setOpenComment] = useState(false);

  const [quickComment, setQuickComment] = useState("");

  const [quickCommentLoading, setQuickCommentLoading] = useState(false);

  const [expandedCaption, setExpandedCaption] = useState(false);

  const isVideo = Boolean(
    post?.mediaType === "video" ||
      post?.image?.url?.match(/\.(mp4|mov|webm|m4v)($|\?)/i)
  );
  const videoRef = useRef(null);

  // Autoplay video on home feed when scrolled into view; turn off when comment dialog is open
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    if (openComment) {
      video.pause();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !openComment) {
            video.play().catch(() => {
              // Browser policy may require muted for autoplay
              video.muted = true;
              video.play().catch(() => {});
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [isVideo, openComment, post?.image?.url]);

  // Keep local state in sync when post/user changes
  const currentUserId = String(user?._id ?? "");

  const postUrl = post?._id ? `${window.location.origin}/post/${post._id}` : "";

  const postIsLiked = Boolean(
    post?.likes?.some((item) => String(item?._id ?? item) === currentUserId),
  );

  const postIsBookmarked = Boolean(
    post?.bookmarks?.some(
      (item) => String(item?._id ?? item) === currentUserId,
    ),
  );

  const postLikeCount = post?.likes?.length ?? 0;
  const postCommentCount = post?.comments?.length ?? 0;

  useEffect(() => {
    setIsLiked(postIsLiked);
    setIsBookmarked(postIsBookmarked);
    setLikeCount(postLikeCount);
    setCommentCount(postCommentCount);
  }, [
    post?._id,
    currentUserId,
    postIsLiked,
    postIsBookmarked,
    postLikeCount,
    postCommentCount,
  ]);

  // ================= LIKE =================

  const handleLike = async (event) => {
    event.stopPropagation();

    if (likeLoading || !post?._id) return;

    const action = isLiked ? "dislike" : "like";

    console.log("[LIKE UI] Sending request", {
      postId: post._id,
      action,
      isLikedBeforeRequest: isLiked,
    });

    try {
      setLikeLoading(true);

      const response =
        action === "dislike"
          ? await dislikePost(post._id)
          : await likePost(post._id);

      console.log("[LIKE UI] API response", {
        action,
        success: response?.success,
        isLiked: response?.isLiked,
        likeCount: response?.likeCount,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update like");
      }

      setIsLiked(response.isLiked);
      setLikeCount(response.likeCount);

      toast.success(response.message);
    } catch (error) {
      console.error("[LIKE UI] Request failed", {
        action,
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
      });

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update like",
      );
    } finally {
      setLikeLoading(false);
    }
  };

  // ================= COMMENT DIALOG =================

  const handleCommentClick = (event) => {
    event.stopPropagation();
    setOpenComment(true);
  };

  const handleCommentAdded = () => {
    setCommentCount((previousCount) => previousCount + 1);
  };

  // const handleShare = async (event) => {
  //   event.stopPropagation();

  //   if (!post?._id) return;

  //   const shareUrl = `${window.location.origin}/post/${post._id}`;

  //   const shareData = {
  //     title: `Post by @${author?.username || "user"}`,
  //     text: post.caption || "Check out this post on Nexo.",
  //     url: shareUrl,
  //   };

  //   try {
  //     // Use the device's native share menu when supported.
  //     if (typeof navigator.share === "function") {
  //       await navigator.share(shareData);
  //       return;
  //     }

  //     // Desktop and unsupported-browser fallback.
  //     if (navigator.clipboard?.writeText) {
  //       await navigator.clipboard.writeText(shareUrl);
  //       toast.success("Post link copied");
  //       return;
  //     }

  //     // Last fallback for browsers without clipboard access.
  //     window.prompt("Copy this post link:", shareUrl);
  //   } catch (error) {
  //     // Closing the native share menu isn't an actual failure.
  //     if (error.name === "AbortError") return;

  //     console.error("Share error:", error);
  //     toast.error("Couldn't share this post");
  //   }
  // };

  const handleShare = (event) => {
    event.stopPropagation();
    if (!post?._id) {
      toast.error("Post link is unavailable");
      return;
    }
    setShareOpen(true);
  };

  const handleBookmark = async (event) => {
    event.stopPropagation();

    if (bookmarkLoading || !post?._id) return;

    try {
      setBookmarkLoading(true);

      const response = await toggleBookmark(post._id);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update like");
      }

      console.log("Bookmark Response", response);
      toast.success(response.message);

      setIsBookmarked(response.isBookmarked);
    } catch (error) {
      console.error("Bookmark error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update like",
      );
    } finally {
      setBookmarkLoading(false);
    }
  };

  // ================= AUTHOR =================

  const handleAuthorClick = (event) => {
    event.stopPropagation();

    if (!author?.username) return;

    navigate(`/profile/${author.username}`);
  };

  // ================= POST =================

  const handlePostClick = () => {
    if (!post?._id) return;

    navigate(`/post/${post._id}`);
  };

  // ================= QUICK COMMENT =================

  const handleQuickComment = async () => {
    const text = quickComment.trim();

    if (!text || quickCommentLoading || !post?._id) {
      return;
    }

    if (text.length > 500) {
      toast.error("Comment must be 500 characters or less");
      return;
    }

    try {
      setQuickCommentLoading(true);

      const response = await addComment(post._id, text);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to add comment");
      }

      setQuickComment("");

      setCommentCount((previousCount) => previousCount + 1);

      toast.success("Comment added");
    } catch (error) {
      console.error("Quick comment error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to add comment",
      );
    } finally {
      setQuickCommentLoading(false);
    }
  };

  return (
    <>
      <article className="border-b border-[#E4E1DB] bg-white px-4 py-5 transition hover:bg-[#FCFBF9]">
        {/* ================= AUTHOR ================= */}

        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAuthorClick}
            className="flex cursor-pointer items-center gap-3 text-left"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={author?.profilePicture?.url}
                alt={author?.username || "User"}
                className="aspect-square object-cover"
              />

              <AvatarFallback>
                {author?.username?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div>
              <p className="text-sm font-semibold text-[#1B1C20]">
                {author?.name || author?.username || "User"}
              </p>

              <p className="text-xs text-[#686A72]">
                @{author?.username || "user"}
              </p>
            </div>
          </button>

          {/* ================= MORE ================= */}

          <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMoreOpen(true);
                }}
                className="cursor-pointer text-[#686A72] hover:text-[#1B1C20] dark:text-neutral-400 dark:hover:text-white"
              >
                <MoreHorizontal size={21} />
              </button>
            </DialogTrigger>

            <DialogContent
              showCloseButton={false}
              className="flex max-w-[300px] flex-col items-center gap-0 overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white p-0 text-center text-sm shadow-2xl dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-white"
              onClick={(event) => event.stopPropagation()}
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
                onClick={(e) => {
                  setMoreOpen(false);
                  handleBookmark(e);
                }}
                className="w-full border-b border-[#E4E1DB] py-3.5 font-medium transition hover:bg-black/5 dark:border-[#262626] dark:hover:bg-white/5"
              >
                {isBookmarked ? "Remove bookmark" : "Bookmark"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  if (postUrl) {
                    navigator.clipboard.writeText(postUrl);
                    toast.success("Link copied to clipboard");
                  }
                }}
                className="w-full border-b border-[#E4E1DB] py-3.5 font-medium transition hover:bg-black/5 dark:border-[#262626] dark:hover:bg-white/5"
              >
                Copy link
              </button>

              {user?._id?.toString() !== author?._id?.toString() && (
                <button
                  type="button"
                  onClick={async () => {
                    setMoreOpen(false);
                    if (author?._id) {
                      await followOrUnfollow(author._id);
                      toast.success("Follow status updated");
                    }
                  }}
                  className="w-full border-b border-[#E4E1DB] py-3.5 font-bold text-red-500 transition hover:bg-black/5 dark:border-[#262626] dark:hover:bg-white/5"
                >
                  Unfollow
                </button>
              )}

              {user?._id?.toString() === author?._id?.toString() && (
                <button
                  type="button"
                  onClick={async () => {
                    setMoreOpen(false);
                    try {
                      await deletePost(post._id);
                      toast.success("Post deleted");
                      window.location.reload();
                    } catch (err) {
                      toast.error("Failed to delete post");
                    }
                  }}
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
        </div>

        {/* ================= MEDIA (IMAGE / VIDEO) ================= */}

        {post?.image?.url && (
          <div
            className="mb-4 overflow-hidden rounded-xl bg-[#F7F6F3] dark:bg-black/30"
          >
            {post.mediaType === "video" || post.image.url.match(/\.(mp4|mov|webm|m4v)($|\?)/i) ? (
              <video
                ref={videoRef}
                src={post.image.url}
                controls
                playsInline
                loop
                className="max-h-[650px] w-full object-contain bg-black"
              />
            ) : (
              <div onClick={handlePostClick} className="cursor-pointer">
                <img
                  src={post.image.url}
                  alt={post.caption || `Post by @${author?.username}`}
                  className="max-h-[650px] w-full object-cover"
                />
              </div>
            )}
          </div>
        )}

        {/* ================= CAPTION ================= */}

        {post?.caption && (
          <div className="mb-4">
            <p className="text-sm leading-6 text-[#1B1C20] dark:text-neutral-200">
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

        {/* ================= ACTIONS ================= */}

        <div className="flex items-center justify-between ">
          <div className="flex items-center gap-2">
            {/* LIKE */}

            <button
              type="button"
              disabled={likeLoading}
              onClick={handleLike}
              className="flex h-10  cursor-pointer items-center gap-1 rounded-full px-3 transition hover:bg-[#F7F6F3]"
            >
              <Heart
                size={21}
                className={
                  isLiked ? "fill-[#FF4D00] text-[#FF4D00]" : "text-[#1B1C20]"
                }
              />

              <span className="text-sm text-[#1B1C20]">{likeCount}</span>
            </button>

            {/* COMMENT */}

            <button
              type="button"
              onClick={handleCommentClick}
              className="flex cursor-pointer h-10 items-center gap-1 rounded-full px-3 transition hover:bg-[#F7F6F3]"
            >
              <MessageCircle size={21} className="text-[#1B1C20]" />

              <span className="text-sm text-[#1B1C20]">{commentCount}</span>
            </button>

            {/* SHARE */}

            <button
              type="button"
              onClick={handleShare}
              className="flex cursor-pointer h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#F7F6F3]"
            >
              <Send size={20} className="text-[#1B1C20]" />
            </button>
          </div>

          {/* BOOKMARK */}

          <button
            type="button"
            onClick={handleBookmark}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#F7F6F3]"
          >
            <Bookmark
              size={21}
              className={
                isBookmarked
                  ? "fill-[#FF4D00] text-[#FF4D00]"
                  : "text-[#1B1C20]"
              }
            />
          </button>
        </div>

        {/* ================= QUICK COMMENT ================= */}

        <div
          onClick={(event) => event.stopPropagation()}
          className="mt-3 flex items-center gap-2"
        >
          <input
            type="text"
            value={quickComment}
            maxLength={500}
            disabled={quickCommentLoading}
            onChange={(event) => setQuickComment(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleQuickComment();
              }
            }}
            placeholder="Add a comment..."
            className="min-w-0 flex-1 rounded border border-[#E4E1DB] bg-[#F7F6F3] px-4 py-2 text-sm text-[#1B1C20] outline-none placeholder:text-[#9A9CA3] focus:border-[#FF4D00]"
          />

          <button
            type="button"
            disabled={!quickComment.trim() || quickCommentLoading}
            onClick={handleQuickComment}
            className="px-2 text-sm font cursor-pointer text-semibold text-[#FF4D00] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {quickCommentLoading ? "..." : "Post"}
          </button>
        </div>
      </article>

      {/* ================= COMMENT DIALOG ================= */}

      <CommentDialog
        openComment={openComment}
        setOpenComment={setOpenComment}
        post={post}
        isLiked={isLiked}
        likeCount={likeCount}
        onLikeChange={(newIsLiked, newLikeCount) => {
          setIsLiked(newIsLiked);
          setLikeCount(newLikeCount);
        }}
        onCommentAdded={handleCommentAdded}
      />

      <SharePostDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        postUrl={postUrl}
        postCaption={post?.caption || ""}
        postId={post?._id}
      />

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        contact={author}
        onSubmit={async ({ reason, details }) => {
          try {
            if (author?._id) {
              const res = await reportUser(author._id, { reason, details });
              if (res?.success) {
                toast.success("Report submitted successfully. Thank you.");
              }
            }
          } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit report.");
          }
        }}
      />
    </>
  );
};

export default PostCard;

// import React, { useState } from "react";
// import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
// import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
// import {
//   Bookmark,
//   Heart,
//   MessageCircle,
//   MoreHorizontal,
//   Send,
// } from "lucide-react";
// import { Button } from "../ui/button";
// import CommentDialog from "./CommentDialog";
// import { useAuth } from "@/context/AuthContext";
// import { likePost, dislikePost } from "@/services/postService";
// import { toast } from "sonner";

// const PostCard = ({ post }) => {
//   const [openComment, setOpenComment] = useState(false);
//   const { user } = useAuth();

//   const postAuthor = post.author;
//   const profileImage = postAuthor?.profilePicture?.url;

//   const [likeCount, setLikeCount] = useState(post?.likes?.length || 0);
//   const [isLiked, setIsLiked] = useState(
//     post.likes?.some(
//       (userId) => userId.toString() === user?._id?.toString() || false,
//     ),
//   );

//   const handleLike = async () => {
//     try {
//       const response = isLiked
//         ? await dislikePost(post._id)
//         : await likePost(post._id);

//       console.log("LIKE RESPONSE:", response);

//       setIsLiked(response.isLiked);
//       setLikeCount(response?.likeCount);
//     } catch (error) {
//       console.log("Like error:", error);
//     }
//   };
//   return (
//     <div className="w-full max-w-sm  mx-auto">
//       <div className="flex my-3 items-center justify-between">
//         <div className="flex items-center gap-5">
//           <Avatar>
//             <AvatarImage
//               src={profileImage}
//               alt={postAuthor?.username}
//               className="rounded-full aspect-square object-cover"
//             />
//             <AvatarFallback>
//               {postAuthor?.username?.charAt(0)?.toUpperCase() || "U"}
//             </AvatarFallback>
//           </Avatar>
//           <p className="text-sm text-orange-400">
//             @{postAuthor?.username || "user"}
//           </p>
//         </div>

//         <Dialog>
//           <DialogTrigger className="cursor-pointer">
//             <MoreHorizontal />
//           </DialogTrigger>
//           <DialogContent
//             showCloseButton={false}
//             className="flex flex-col text-sm items-center text-center"
//           >
//             <Button
//               variant="ghost"
//               className="cursor-pointer font-bold text-orange-600"
//             >
//               Unfollow
//             </Button>
//             <Button
//               variant="ghost"
//               className="cursor-pointer font-bold text-orange-600"
//             >
//               Add to favorite
//             </Button>
//             {user && user?._id.toString() === postAuthor?._id.toString() && (
//               <Button
//                 variant="ghost"
//                 className="cursor-pointer font-bold text-orange-600"
//               >
//                 Delete
//               </Button>
//             )}
//           </DialogContent>
//         </Dialog>
//       </div>

//       <img
//         className="w-full object-cover aspect-square"
//         src={post?.image?.url}
//         alt={postAuthor?.username}
//       />

//       <div>
//         <div className="flex items-center gap-5 my-5 justify-between">
//           <div className="flex items-center gap-5">
//             <div className="flex gap-1">
//               <Heart
//                 className="cursor-pointer"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   handleLike();
//                 }}
//                 color={isLiked ? "red" : "black"}
//                 fill={isLiked ? "red" : "none"}
//               />
//               <span>{likeCount}</span>
//             </div>
//             <div className="flex gap-1">
//               <MessageCircle
//                 onClick={() => setOpenComment(true)}
//                 className="cursor-pointer hover:text-orange-500"
//               />
//               <span>{post?.comments.length}</span>
//             </div>
//             <Send className="cursor-pointer hover:text-orange-500" />
//           </div>

//           <Bookmark className="cursor-pointer hover:text-orange-500" />
//         </div>

//         <p>caption</p>

//         {openComment && (
//           <CommentDialog
//             openComment={openComment}
//             setOpenComment={setOpenComment}
//             post={post}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// export default PostCard;
