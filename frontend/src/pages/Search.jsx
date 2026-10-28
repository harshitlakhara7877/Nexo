import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  LoaderCircle,
  Heart,
  MessageCircle,
  Play,
} from "lucide-react";

import { getDiscoverPosts, searchPosts } from "@/services/postService";
import { searchUsers } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";
import CommentDialog from "@/components/post/CommentDialog";

const getVideoThumbnail = (url) => {
  if (!url) return "";
  if (url.match(/\.(mp4|mov|webm|m4v)($|\?)/i)) {
    return url.replace(/\.(mp4|mov|webm|m4v)(\?.*)?$/i, ".jpg$2");
  }
  return url;
};

const Search = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("discover");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const [posts, setPosts] = useState([]);
  const [postResults, setPostResults] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchingPosts, setSearchingPosts] = useState(false);

  const [discoverError, setDiscoverError] = useState("");
  const [peopleError, setPeopleError] = useState("");
  const [postError, setPostError] = useState("");
  const [postRetry, setPostRetry] = useState(0);

  const [selectedPost, setSelectedPost] = useState(null);
  const [openComment, setOpenComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Load recent posts for the default Discover view.
  useEffect(() => {
    let cancelled = false;

    getDiscoverPosts()
      .then((response) => {
        if (!response?.success) {
          throw new Error(response?.message || "Unable to load posts.");
        }

        if (!cancelled) {
          setPosts(response.posts || []);
          setDiscoverError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPosts([]);
          setDiscoverError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load posts.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Typing searches people after a short debounce.
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed || mode !== "people") return undefined;

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setSearching(true);

      try {
        const response = await searchUsers(trimmed);

        if (!response?.success) {
          throw new Error(response?.message || "Search failed.");
        }

        if (!cancelled) {
          setUsers(response.users || []);
          setPeopleError("");
        }
      } catch (err) {
        if (!cancelled) {
          setUsers([]);
          setPeopleError(
            err.response?.data?.message ||
              err.message ||
              "Unable to search users.",
          );
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, mode]);

  // Pressing Enter submits a separate post-search request.
  useEffect(() => {
    if (mode !== "posts" || !submittedQuery) {
      return undefined;
    }

    let cancelled = false;

    searchPosts(submittedQuery, 1, 12)
      .then((response) => {
        if (!response?.success) {
          throw new Error(response?.message || "Post search failed.");
        }

        if (!cancelled) {
          setPostResults(response.posts || []);
          setPostError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPostResults([]);
          setPostError(
            err.response?.data?.message ||
              err.message ||
              "Unable to search posts.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSearchingPosts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, submittedQuery, postRetry]);

  const handleQueryChange = (event) => {
    const value = event.target.value;
    const hasQuery = Boolean(value.trim());

    setQuery(value);
    setMode(hasQuery ? "people" : "discover");
    setSubmittedQuery("");

    setUsers([]);
    setPeopleError("");
    setPostResults([]);
    setPostError("");
    setSearching(hasQuery);
    setSearchingPosts(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmed = query.trim();

    if (!trimmed) return;

    setSubmittedQuery(trimmed);
    setMode("posts");

    setUsers([]);
    setPeopleError("");
    setSearching(false);

    setPostResults([]);
    setPostError("");
    setSearchingPosts(true);

    // Allows submitting the same query again.
    setPostRetry((current) => current + 1);
  };

  const retryPostSearch = () => {
    setPostError("");
    setSearchingPosts(true);
    setPostRetry((current) => current + 1);
  };

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

  const renderPostGrid = (items) => (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-4">
      {items.map((post) => {
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
            className="group relative aspect-square overflow-hidden rounded-xl bg-white dark:bg-[#181818] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00]"
          >
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={post.caption || "Community post"}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[#F2F0EC] dark:bg-[#1A1A1A]">
                <SearchIcon size={24} className="text-[#B0AEA8]" />
              </div>
            )}

            {/* Video Play overlay icon */}
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

            {/* Post Author avatar and username pill */}
            {post.author && (
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
                    {(post.author.username || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="truncate text-xs font-medium text-white">
                  {post.author.username}
                </span>
              </div>
            )}

            {/* Subtle hover overlay with like and comment counts */}
            <div className="absolute inset-0 flex items-center justify-center gap-5 bg-black/45 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 max-sm:opacity-100 max-sm:bg-gradient-to-t max-sm:from-black/60 max-sm:via-transparent max-sm:items-end">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-white drop-shadow">
                <Heart size={18} className="fill-white text-white" />
                {likeCount}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-white drop-shadow">
                <MessageCircle size={18} className="fill-white text-white" />
                {commentCount}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <main className="min-h-screen mr-50 bg-[#F7F6F3] px-4 py-6 md:px-8 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <form
          onSubmit={handleSubmit}
          className="mb-7 flex items-center gap-3 rounded-xl border border-[#E4E1DB] bg-white px-4 py-3 focus-within:border-orange-500 dark:border-[#262626] dark:bg-[#121212]"
        >
          <SearchIcon
            size={20}
            className="text-[#686A72] dark:text-neutral-400"
          />

          <input
            type="search"
            value={query}
            maxLength={100}
            onChange={handleQueryChange}
            placeholder="Search people or posts..."
            aria-label="Search people or posts"
            className="w-full bg-transparent text-sm text-[#1B1C20] dark:text-white outline-none placeholder:text-[#686A72] dark:placeholder:text-neutral-500"
          />
        </form>

        {mode === "people" ? (
          <section>
            <h2 className="mb-4 font-semibold text-[#1B1C20] dark:text-white">
              People
            </h2>

            {peopleError ? (
              <p role="alert" className="py-8 text-center text-red-600">
                {peopleError}
              </p>
            ) : searching ? (
              <p className="flex items-center justify-center gap-2 py-8 text-[#686A72] dark:text-neutral-400">
                <LoaderCircle size={17} className="animate-spin" />
                Searching people...
              </p>
            ) : users.length === 0 ? (
              <p className="py-8 text-center text-[#686A72] dark:text-neutral-400">
                No users found. Press Enter to search posts.
              </p>
            ) : (
              <div className="divide-y divide-[#E4E1DB] dark:divide-[#262626] rounded-xl bg-white dark:bg-[#121212] px-4">
                {users.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => navigate(`/profile/${user.username}`)}
                    className="flex w-full items-center gap-3 py-4 text-left hover:bg-[#FCFBF9] dark:hover:bg-[#1A1A1A]"
                  >
                    {user.profilePicture?.url ? (
                      <img
                        src={user.profilePicture.url}
                        alt=""
                        className="h-11 w-11 rounded-full bg-[#F7F6F3] dark:bg-[#202020] object-cover"
                      />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF0E8] font-semibold text-[#FF4D00] dark:bg-[#2A180E]">
                        {(user.name || user.username || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}

                    <div>
                      <p className="font-semibold text-[#1B1C20] dark:text-white">
                        {user.name || user.username}
                      </p>
                      <p className="text-sm text-[#686A72] dark:text-neutral-400">
                        @{user.username}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : mode === "posts" ? (
          <section>
            <h2 className="mb-4 font-semibold text-[#1B1C20] dark:text-white">
              Posts matching "{submittedQuery}"
            </h2>

            {searchingPosts ? (
              <p className="flex items-center justify-center gap-2 py-8 text-[#686A72] dark:text-neutral-400">
                <LoaderCircle size={17} className="animate-spin" />
                Searching posts...
              </p>
            ) : postError ? (
              <div className="py-8 text-center">
                <p role="alert" className="text-sm text-red-600">
                  {postError}
                </p>
                <button
                  type="button"
                  onClick={retryPostSearch}
                  className="mt-3 text-sm font-semibold text-orange-600"
                >
                  Try again
                </button>
              </div>
            ) : postResults.length === 0 ? (
              <p className="py-8 text-center text-[#686A72] dark:text-neutral-400">
                No posts matched this query.
              </p>
            ) : (
              renderPostGrid(postResults)
            )}
          </section>
        ) : (
          <section>
            <h2 className="mb-4 font-semibold text-[#1B1C20] dark:text-white">
              Discover posts
            </h2>

            {discoverError ? (
              <p role="alert" className="py-8 text-center text-red-600">
                {discoverError}
              </p>
            ) : loading ? (
              <p className="py-8 text-center text-[#686A72] dark:text-neutral-400">
                Loading posts...
              </p>
            ) : posts.length === 0 ? (
              <p className="py-8 text-center text-[#686A72] dark:text-neutral-400">
                No posts to discover yet.
              </p>
            ) : (
              renderPostGrid(posts)
            )}
          </section>
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
            const updateList = (list) =>
              list.map((p) =>
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
              );
            setPosts(updateList);
            setPostResults(updateList);
          }}
          onCommentAdded={() => {
            const updateComments = (list) =>
              list.map((p) =>
                p._id === selectedPost._id
                  ? {
                      ...p,
                      comments: [...(p.comments || []), {}],
                    }
                  : p,
              );
            setPosts(updateComments);
            setPostResults(updateComments);
          }}
        />
      )}
    </main>
  );
};

export default Search;
