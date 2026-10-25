import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, LoaderCircle } from "lucide-react";

import { getDiscoverPosts, searchPosts } from "@/services/postService";

import { searchUsers } from "@/services/userService";

const Search = () => {
  const navigate = useNavigate();

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

    console.log("[SEARCH UI] Calling post search", {
      submittedQuery,
      page: 1,
    });

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

    console.log("[SEARCH UI] Enter pressed", {
      query,
      trimmed,
      currentMode: mode,
    });
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

  const renderPostGrid = (items) => (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-4">
      {items.map((post) => (
        <button
          key={post._id}
          type="button"
          onClick={() => navigate(`/post/${post._id}`)}
          className="aspect-square overflow-hidden rounded-xl bg-white"
        >
          <img
            src={post.image?.url}
            alt={post.caption || "Community post"}
            loading="lazy"
            className="h-full w-full object-cover transition hover:scale-105"
          />
        </button>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F7F6F3] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-5 text-2xl font-bold text-[#1B1C20]">Search</h1>

        <form
          onSubmit={handleSubmit}
          className="mb-7 flex items-center gap-3 rounded-xl border border-[#E4E1DB] bg-white px-4 py-3 focus-within:border-orange-500"
        >
          <SearchIcon size={20} className="text-[#686A72]" />

          <input
            type="search"
            value={query}
            maxLength={100}
            onChange={handleQueryChange}
            placeholder="Search people or posts..."
            aria-label="Search people or posts"
            className="w-full bg-transparent text-sm text-[#1B1C20] outline-none"
          />

          {/* {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="text-sm text-orange-600"
            >
              Clear
            </button>
          )} */}
        </form>

        {mode === "people" ? (
          <section>
            <h2 className="mb-4 font-semibold text-[#1B1C20]">People</h2>

            {peopleError ? (
              <p role="alert" className="py-8 text-center text-red-600">
                {peopleError}
              </p>
            ) : searching ? (
              <p className="flex items-center justify-center gap-2 py-8 text-[#686A72]">
                <LoaderCircle size={17} className="animate-spin" />
                Searching people...
              </p>
            ) : users.length === 0 ? (
              <p className="py-8 text-center text-[#686A72]">
                No users found. Press Enter to search posts.
              </p>
            ) : (
              <div className="divide-y divide-[#E4E1DB] rounded-xl bg-white px-4">
                {users.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => navigate(`/profile/${user.username}`)}
                    className="flex w-full items-center gap-3 py-4 text-left hover:bg-[#FCFBF9]"
                  >
                    {user.profilePicture?.url ? (
                      <img
                        src={user.profilePicture.url}
                        alt=""
                        className="h-11 w-11 rounded-full bg-[#F7F6F3] object-cover"
                      />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF0E8] font-semibold text-[#FF4D00]">
                        {(user.name || user.username || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}

                    <div>
                      <p className="font-semibold text-[#1B1C20]">
                        {user.name || user.username}
                      </p>
                      <p className="text-sm text-[#686A72]">@{user.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : mode === "posts" ? (
          <section>
            <h2 className="mb-4 font-semibold text-[#1B1C20]">
              Posts matching "{submittedQuery}"
            </h2>

            {searchingPosts ? (
              <p className="flex items-center justify-center gap-2 py-8 text-[#686A72]">
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
              <p className="py-8 text-center text-[#686A72]">
                No posts matched this query.
              </p>
            ) : (
              renderPostGrid(postResults)
            )}
          </section>
        ) : (
          <section>
            <h2 className="mb-4 font-semibold text-[#1B1C20]">
              Discover posts
            </h2>

            {discoverError ? (
              <p role="alert" className="py-8 text-center text-red-600">
                {discoverError}
              </p>
            ) : loading ? (
              <p className="py-8 text-center text-[#686A72]">
                Loading posts...
              </p>
            ) : posts.length === 0 ? (
              <p className="py-8 text-center text-[#686A72]">
                No posts to discover yet.
              </p>
            ) : (
              renderPostGrid(posts)
            )}
          </section>
        )}
      </div>
    </main>
  );
};

export default Search;
