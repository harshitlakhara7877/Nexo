import { useEffect, useState } from "react";
import { Bookmark, Heart, MoreHorizontal, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { useAuth } from "@/context/AuthContext";
import {
  addComment,
  getComments,
  likePost,
  dislikePost,
} from "@/services/postService";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

const CommentDialog = ({
  openComment,
  setOpenComment,
  post,
  isLiked,
  likeCount,
  onLikeChange,
  onCommentAdded,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const author = post?.author;
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [likeLoading, setLikeLoading] = useState(false);

  const [expandedComments, setExpandedComments] = useState({});
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

      onLikeChange(response.isLiked, response.likeCount);
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

  return (
    <Dialog open={openComment} onOpenChange={setOpenComment}>
      <DialogContent
        className="max-w-4xl sm:max-w-5xl overflow-hidden p-0"
        showCloseButton={false}
      >
        <div className="flex h-[650px]">
          {/* ================= POST IMAGE ================= */}

          <div className="hidden w-1/2 bg-black md:block">
            {post?.image?.url && (
              <img
                src={post.image.url}
                alt={post?.caption || "Post image"}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {/* ================= RIGHT SIDE ================= */}

          <div className="flex w-full  flex-col md:w-1/2">
            {/* HEADER */}

            <div className="mb-4 flex p-2 mr-2 items-center justify-between">
              <button
                type="button"
                onClick={() => handleAuthorClick(e, author?.username)}
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
                    @{author?.username || "User"}
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
            {/* COMMENTS */}

            <div className="flex-1 overflow-y-auto p-4">
              {commentsLoading ? (
                <p className="text-center text-sm text-[#686A72]">
                  Loading comments...
                </p>
              ) : comments.length === 0 ? (
                <p className="text-center text-sm text-[#686A72]">
                  No comments yet.
                </p>
              ) : (
                <div className="space-y-5">
                  {comments.map((comment) => (
                    <div 
                    key={comment._id} 
                    className="flex gap-4"
                    >
                      <Avatar 
                      className="h-10 w-10 cursor-pointer shrink-0"
                      >
                        <AvatarImage
                          src={comment?.author?.profilePicture?.url}
                          alt={comment?.author?.username || "User"}
                          onClick={(e) => handleProfileClick(e, comment?.author?.username,)}
                        />

                        <AvatarFallback>
                          {comment?.author?.username
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <p
                          className={`text-sm text-[#1B1C20] ${
                            !expandedComments[comment._id] ? "line-clamp-2" : ""
                          }`}
                        >
                          {comment.text}
                        </p>

                        {comment.text.length > 100 && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();

                              setExpandedComments((previous) => ({
                                ...previous,
                                [comment._id]: !previous[comment._id],
                              }));
                            }}
                            className="mt-1 text-xs font-medium text-[#686A72] cursor-pointer hover:text-[#1B1C20]"
                          >
                            {expandedComments[comment._id] ? "less" : "more"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTIONS */}

            <div className="border-t flex justify-between border-[#E4E1DB] px-4 py-2">
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  disabled={likeLoading}
                  onClick={handleLike}
                  className="flex items-center gap-1"
                >
                  <Heart
                    size={22}
                    className={
                      isLiked
                        ? "fill-[#FF4D00] text-[#FF4D00]"
                        : "text-[#1B1C20]"
                    }
                  />

                  <span className="text-sm">{likeCount}</span>
                </button>

                <button type="button" className="flex items-center">
                  <Send size={21} className="text-[#1B1C20]" />
                </button>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#F7F6F3]"
              >
                <Bookmark size={21} className="text-[#1B1C20]" />
              </button>
            </div>

            {/* ADD COMMENT */}

            <div className="border-t border-[#E4E1DB] p-3">
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
                  className="min-w-0 flex-1 rounded border border-[#E4E1DB] bg-[#F7F6F3] px-4 py-2 text-sm outline-none placeholder:text-[#9A9CA3] focus:border-[#FF4D00]"
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
    </Dialog>
  );
};

export default CommentDialog;



