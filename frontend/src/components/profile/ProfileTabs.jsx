import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Play,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import CommentDialog from "@/components/post/CommentDialog";

const getVideoThumbnail = (url) => {
  if (!url) return "";
  if (url.match(/\.(mp4|mov|webm|m4v)($|\?)/i)) {
    return url.replace(/\.(mp4|mov|webm|m4v)(\?.*)?$/i, ".jpg$2");
  }
  return url;
};

const ProfileTabs = ({
  posts = [],
  likedPosts = [],
  showLikedTab = true,
  showCreateButton = true,
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");

  const [selectedPost, setSelectedPost] = useState(null);
  const [openComment, setOpenComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const currentTab = showLikedTab ? activeTab : "posts";
  const isLikedTab = currentTab === "liked";

  const displayedPosts = isLikedTab ? likedPosts : posts;

  const handlePostClick = (post) => {
    if (!post?._id) return;
    setSelectedPost(post);
    const currentUserId = currentUser?._id;
    const userLiked =
      post.likes?.some(
        (l) => (typeof l === "object" ? l?._id : l) === currentUserId,
      ) || (isLikedTab && Boolean(currentUserId));
    setIsLiked(Boolean(userLiked));
    setLikeCount(post.likes?.length ?? post.likeCount ?? 0);
    setOpenComment(true);
  };

  return (
    <section className="mt-7 overflow-hidden rounded-2xl border border-[#E8E5DF] bg-white shadow-sm shadow-black/[0.02] dark:border-[#262626] dark:bg-[#121212]">
      {/* ================= TAB HEADER ================= */}
      <div
        role="tablist"
        aria-label="Profile content"
        className="flex border-b border-[#EEECE8] bg-white dark:border-[#262626] dark:bg-[#121212]"
      >
        {/* Posts tab */}
        <button
          id="profile-posts-tab"
          type="button"
          role="tab"
          aria-selected={currentTab === "posts"}
          aria-controls="profile-posts-panel"
          onClick={() => setActiveTab("posts")}
          className={`group relative flex flex-1 items-center justify-center gap-2.5 py-5 text-sm font-semibold transition-colors duration-200 ${
            currentTab === "posts"
              ? "text-[#FF4D00]"
              : "text-[#85858D] hover:text-[#1B1C20] dark:hover:text-white"
          }`}
        >
          <span>Posts</span>

          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
              currentTab === "posts"
                ? "bg-[#FFF0E8] text-[#FF4D00] dark:bg-[#2A180E]"
                : "bg-[#F5F4F1] text-[#85858D] dark:bg-[#1E1E1E] dark:text-neutral-400"
            }`}
          >
            {posts.length}
          </span>

          <span
            className={`absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-[#FF4D00] transition-all duration-300 ${
              currentTab === "posts" ? "w-16 opacity-100" : "w-0 opacity-0"
            }`}
          />
        </button>

        {/* Liked posts tab */}
        {showLikedTab && (
          <button
            id="profile-liked-tab"
            type="button"
            role="tab"
            aria-selected={currentTab === "liked"}
            aria-controls="profile-posts-panel"
            onClick={() => setActiveTab("liked")}
            className={`group relative flex flex-1 items-center justify-center gap-2.5 py-5 text-sm font-semibold transition-colors duration-200 ${
              currentTab === "liked"
                ? "text-[#FF4D00]"
                : "text-[#85858D] hover:text-[#1B1C20] dark:hover:text-white"
            }`}
          >
            <span>Liked</span>

            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                currentTab === "liked"
                  ? "bg-[#FFF0E8] text-[#FF4D00] dark:bg-[#2A180E]"
                  : "bg-[#F5F4F1] text-[#85858D] dark:bg-[#1E1E1E] dark:text-neutral-400"
              }`}
            >
              {likedPosts.length}
            </span>

            <span
              className={`absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-[#FF4D00] transition-all duration-300 ${
                currentTab === "liked" ? "w-16 opacity-100" : "w-0 opacity-0"
              }`}
            />
          </button>
        )}
      </div>

      {/* ================= POSTS PANEL ================= */}
      <div
        id="profile-posts-panel"
        role="tabpanel"
        aria-labelledby={
          isLikedTab ? "profile-liked-tab" : "profile-posts-tab"
        }
        className="min-h-72"
      >
        {displayedPosts.length === 0 ? (
          /* ================= EMPTY STATE ================= */
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-14 text-center">
            <div className="group mb-5 flex size-[72px] items-center justify-center rounded-full border border-[#FFE0D1] bg-gradient-to-br from-[#FFF7F2] to-[#FFEBDD] dark:border-[#382015] dark:from-[#231510] dark:to-[#1B110D] transition-transform duration-300 hover:scale-105">
              {isLikedTab ? (
                <Heart
                  size={28}
                  strokeWidth={1.7}
                  className="text-[#FF4D00] transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <ImageIcon
                  size={28}
                  strokeWidth={1.7}
                  className="text-[#FF4D00] transition-transform duration-300 group-hover:scale-110"
                />
              )}
            </div>

            <h2 className="text-lg font-semibold tracking-tight text-[#1B1C20] dark:text-white">
              {isLikedTab ? "Nothing liked yet" : "Your story starts here"}
            </h2>

            <p className="mt-2 max-w-xs text-sm leading-6 text-[#85858D] dark:text-neutral-400">
              {isLikedTab
                ? "When you find a post you love, tap the heart and it'll appear here."
                : "Share a moment, express yourself, and let the Nexo community see what you're creating."}
            </p>

            {!isLikedTab && showCreateButton && (
              <button
                type="button"
                onClick={() => navigate("/create")}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FF4D00] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-600/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E64400] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00] focus-visible:ring-offset-2"
              >
                <Sparkles size={16} />
                Create your first post
              </button>
            )}
          </div>
        ) : (
          /* ================= POSTS GRID ================= */
          <div className="grid grid-cols-2 gap-1.5 bg-white p-1.5 sm:grid-cols-3 sm:gap-2 sm:p-2 dark:bg-[#121212]">
            {displayedPosts.map((post) => {
              const isVideo =
                post.mediaType === "video" ||
                Boolean(post.image?.url?.match(/\.(mp4|mov|webm|m4v)($|\?)/i));
              const likeCount = post.likes?.length ?? post.likeCount ?? 0;
              const commentCount = post.comments?.length ?? 0;
              const thumbnailUrl = isVideo
                ? getVideoThumbnail(post.image?.url)
                : post.image?.url;

              return (
                <button
                  key={post._id}
                  type="button"
                  onClick={() => handlePostClick(post)}
                  aria-label={`Open post${post.caption ? `: ${post.caption}` : ""}`}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-[#F2F0EC] dark:bg-[#1A1A1A] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF4D00] sm:rounded-xl"
                >
                  {/* Post image/media thumbnail */}
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={post.caption || "Post"}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-focus-visible:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon
                        size={30}
                        strokeWidth={1.5}
                        className="text-[#B0AEA8]"
                      />
                    </div>
                  )}

                  {/* Play icon indicator in top right if post is a video */}
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

                  {/* Liked post author indicator */}
                  {isLikedTab && post.author && (
                    <div className="absolute bottom-2 left-2 z-10 flex max-w-[calc(100%-16px)] items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm">
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

                  {/* Hover overlay with like and comment counts */}
                  <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/45 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 max-sm:opacity-100 max-sm:bg-gradient-to-t max-sm:from-black/60 max-sm:via-transparent max-sm:items-end">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-white drop-shadow">
                      <Heart size={19} className="fill-white text-white" />
                      {likeCount}
                    </span>

                    <span className="flex items-center gap-1.5 text-sm font-semibold text-white drop-shadow">
                      <MessageCircle
                        size={19}
                        className="fill-white text-white"
                      />
                      {commentCount}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
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
            if (selectedPost) {
              selectedPost.likeCount = newCount;
              if (selectedPost.likes) {
                const currentUserId = currentUser?._id;
                if (newIsLiked) {
                  if (
                    !selectedPost.likes.some(
                      (l) =>
                        (typeof l === "object" ? l?._id : l) === currentUserId,
                    )
                  ) {
                    selectedPost.likes.push(currentUserId);
                  }
                } else {
                  selectedPost.likes = selectedPost.likes.filter(
                    (l) =>
                      (typeof l === "object" ? l?._id : l) !== currentUserId,
                  );
                }
              }
            }
          }}
          onCommentAdded={() => {
            if (selectedPost) {
              selectedPost.comments = [...(selectedPost.comments || []), {}];
            }
          }}
        />
      )}
    </section>
  );
};

export default ProfileTabs;
