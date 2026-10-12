import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

const ProfileTabs = ({
  posts = [],
  likedPosts = [],
  showLikedTab = true,
  showCreateButton = true,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");

  const currentTab = showLikedTab ? activeTab : "posts";
  const isLikedTab = currentTab === "liked";

  const displayedPosts = isLikedTab ? likedPosts : posts;

  const handlePostClick = (post) => {
    if (post?._id) {
      navigate(`/post/${post._id}`);
    }
  };

  return (
    <section className="mt-7 overflow-hidden rounded-2xl border border-[#E8E5DF] bg-white shadow-sm shadow-black/[0.02]">
      {/* ================= TAB HEADER ================= */}
      <div
        role="tablist"
        aria-label="Profile content"
        className="flex border-b border-[#EEECE8] bg-white"
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
              : "text-[#85858D] hover:text-[#1B1C20]"
          }`}
        >
          {/* <ImageIcon
            size={17}
            strokeWidth={currentTab === "posts" ? 2.2 : 1.8}
            className="transition-transform duration-200 group-hover:scale-110"
          /> */}

          <span>Posts</span>

          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
              currentTab === "posts"
                ? "bg-[#FFF0E8] text-[#FF4D00]"
                : "bg-[#F5F4F1] text-[#85858D]"
            }`}
          >
            {posts.length}
          </span>

          <span
            className={`absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-[#FF4D00] transition-all duration-300 ${
              currentTab === "posts"
                ? "w-16 opacity-100"
                : "w-0 opacity-0"
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
                : "text-[#85858D] hover:text-[#1B1C20]"
            }`}
          >
            {/* <Heart
              size={17}
              strokeWidth={currentTab === "liked" ? 2.2 : 1.8}
              className={`transition-all duration-200 group-hover:scale-110 ${
                currentTab === "liked" ? "fill-[#FF4D00]" : ""
              }`}
            /> */}

            <span>Liked</span>

            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                currentTab === "liked"
                  ? "bg-[#FFF0E8] text-[#FF4D00]"
                  : "bg-[#F5F4F1] text-[#85858D]"
              }`}
            >
              {likedPosts.length}
            </span>

            <span
              className={`absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-[#FF4D00] transition-all duration-300 ${
                currentTab === "liked"
                  ? "w-16 opacity-100"
                  : "w-0 opacity-0"
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
            <div className="group mb-5 flex size-[72px] items-center justify-center rounded-full border border-[#FFE0D1] bg-gradient-to-br from-[#FFF7F2] to-[#FFEBDD] transition-transform duration-300 hover:scale-105">
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

            <h2 className="text-lg font-semibold tracking-tight text-[#1B1C20]">
              {isLikedTab ? "Nothing liked yet" : "Your story starts here"}
            </h2>

            <p className="mt-2 max-w-xs text-sm leading-6 text-[#85858D]">
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
          <div className="grid grid-cols-2 gap-1.5 bg-white p-1.5 sm:grid-cols-3 sm:gap-2 sm:p-2">
            {displayedPosts.map((post) => (
              <button
                key={post._id}
                type="button"
                onClick={() => handlePostClick(post)}
                aria-label={`Open post${post.caption ? `: ${post.caption}` : ""}`}
                className="group relative aspect-square overflow-hidden rounded-lg bg-[#F2F0EC] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF4D00] sm:rounded-xl"
              >
                {/* Post image */}
                {post.image?.url ? (
                  <img
                    src={post.image.url}
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

                {/* Hover overlay */}
                <div className="absolute inset-0 flex flex-col justify-center bg-black/45 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 max-sm:bg-gradient-to-t max-sm:from-black/55 max-sm:via-transparent max-sm:to-transparent max-sm:opacity-100">
                  {/* Engagement stats */}
                  <div className="flex items-center justify-center gap-5 text-white">
                    <span className="flex items-center gap-1.5 text-sm font-semibold drop-shadow-sm">
                      <Heart
                        size={19}
                        strokeWidth={2.2}
                        className="fill-red-700 text-red-700"
                      />
                      {post.likes?.length ?? post.likeCount ?? 0}
                    </span>

                    <span className="flex items-center gap-1.5 text-sm font-semibold drop-shadow-sm">
                      <MessageCircle
                        size={19}
                        strokeWidth={2.2}
                      />
                      {post.comments?.length ?? 0}
                    </span>
                  </div>

                </div>

                {/* Author preview for liked posts */}
                {isLikedTab && post.author && (
                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-2.5 pt-8 text-left opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 max-sm:opacity-100 sm:p-3 sm:pt-10">
                    {post.author.profilePicture?.url ? (
                      <img
                        src={post.author.profilePicture.url}
                        alt=""
                        className="size-7 shrink-0 rounded-full border border-white/70 object-cover sm:size-8"
                      />
                    ) : (
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-semibold text-white sm:size-8">
                        {post.author.username?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}

                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white sm:text-sm">
                      @{post.author.username || "user"}
                    </span>

                    <ArrowUpRight
                      size={15}
                      className="shrink-0 text-white/80"
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProfileTabs;