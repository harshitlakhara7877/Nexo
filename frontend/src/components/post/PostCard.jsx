import { useEffect, useState } from "react";
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
import { likePost, dislikePost, addComment, toggleBookmark } from "@/services/postService";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { useAuth } from "@/context/AuthContext";

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

  const [openComment, setOpenComment] = useState(false);

  const [quickComment, setQuickComment] = useState("");

  const [quickCommentLoading, setQuickCommentLoading] = useState(false);

  // Keep local state in sync when post/user changes
  useEffect(() => {
    setIsLiked(
      post?.likes?.some(
        (userId) => userId?.toString() === user?._id?.toString(),
      ) || false,
    );
    setIsBookmarked(
      post?.bookmarks?.some(
        (userId) => userId?.toString() === user?._id?.toString(),
      ) || false,
    );
    setLikeCount(post?.likes?.length || 0);

    setCommentCount(post?.comments?.length || 0);
  }, [post, user]);

  // ================= LIKE =================

  const handleLike = async (event) => {
    event.stopPropagation();

    if (likeLoading || !post?._id) return;

    try {
      setLikeLoading(true);

      const response = isLiked
        ? await dislikePost(post._id)
        : await likePost(post._id);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update like");
      }

      console.log("Like Response", response);
      toast.success(response.message)

      setIsLiked(response.isLiked);
      setLikeCount(response.likeCount);
    } catch (error) {
      console.error("Like error:", error);

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


  const handleShare = async (event) => {
  event.stopPropagation();

  if (!post?._id) return;

  const shareUrl =
    `${window.location.origin}/post/${post._id}`;

  const shareData = {
    title: `Post by @${author?.username || "user"}`,
    text: post.caption || "Check out this post on Nexo.",
    url: shareUrl,
  };

  try {
    // Use the device's native share menu when supported.
    if (typeof navigator.share === "function") {
      await navigator.share(shareData);
      return;
    }

    // Desktop and unsupported-browser fallback.
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Post link copied");
      return;
    }

    // Last fallback for browsers without clipboard access.
    window.prompt("Copy this post link:", shareUrl);
  } catch (error) {
    // Closing the native share menu isn't an actual failure.
    if (error.name === "AbortError") return;

    console.error("Share error:", error);
    toast.error("Couldn't share this post");
  }
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
      toast.success(response.message)

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

          <Dialog>
            <DialogTrigger>
              <MoreHorizontal size={21} />
            </DialogTrigger>

            <DialogContent
              showCloseButton={false}
              className="flex flex-col items-center text-center text-sm"
              onClick={(event) => event.stopPropagation()}
            >
              <Button
                variant="ghost"
                className="cursor-pointer font-bold text-orange-600"
              >
                Unfollow
              </Button>

              <Button
                variant="ghost"
                className="cursor-pointer font-bold text-orange-600"
              >
                Add to favorite
              </Button>

              {user?._id?.toString() === author?._id?.toString() && (
                <Button
                  variant="ghost"
                  className="cursor-pointer font-bold text-orange-600"
                >
                  Delete
                </Button>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* ================= IMAGE ================= */}

        {post?.image?.url && (
          <div
            className="mb-4 overflow-hidden rounded bg-[#F7F6F3] cursor-pointer"
            onClick={handlePostClick}
          >
            <img
              src={post.image.url}
              alt={post.caption || `Post by @${author?.username}`}
              className="max-h-[650px] w-full object-cover"
            />
          </div>
        )}

        {/* ================= CAPTION ================= */}

        {post?.caption && (
          <p className="mb-4 text-sm leading-6 text-[#1B1C20]">
            {post.caption}
          </p>
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
                  isBookmarked ? "fill-[#FF4D00] text-[#FF4D00]" : "text-[#1B1C20]"
                } />
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
