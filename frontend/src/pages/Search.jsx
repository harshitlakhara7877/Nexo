
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { getDiscoverPosts } from "@/services/postService";
import { searchUsers } from "@/services/userService";

const Search = () => {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Default view: recent image posts
  useEffect(() => {
    let cancelled = false;

    getDiscoverPosts()
      .then((response) => {
        if (!response?.success) {
          throw new Error(response?.message || "Unable to load posts");
        }
        if (!cancelled) setPosts(response.posts || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Search mode: show users instead of the image grid
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setUsers([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const response = await searchUsers(trimmed);
        if (!response?.success) {
          throw new Error(response?.message || "Search failed");
        }
        if (!cancelled) setUsers(response.users || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <main className="min-h-screen bg-[#F7F6F3] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-5 text-2xl font-bold text-[#1B1C20]">Search</h1>

        <div className="mb-7 flex items-center gap-3 rounded-xl border border-[#E4E1DB] bg-white px-4 py-3 focus-within:border-orange-500">
          <SearchIcon size={20} className="text-[#686A72]" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setError("");
            }}
            placeholder="Search people..."
            className="w-full bg-transparent text-sm text-[#1B1C20] outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setError("");
              }}
              className="text-sm text-orange-600"
            >
              Clear
            </button>
          )}
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}

        {query.trim() ? (
          <section>
            <h2 className="mb-4 font-semibold text-[#1B1C20]">
              People
            </h2>

            {searching ? (
              <p className="py-8 text-center text-[#686A72]">
                Searching...
              </p>
            ) : users.length === 0 ? (
              <p className="py-8 text-center text-[#686A72]">
                No users found.
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
                    <img
                      src={user.profilePicture?.url || ""}
                      alt=""
                      className="h-11 w-11 rounded-full bg-[#F7F6F3] object-cover"
                    />
                    <div>
                      <p className="font-semibold text-[#1B1C20]">
                        {user.name || user.username}
                      </p>
                      <p className="text-sm text-[#686A72]">
                        @{user.username}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section>
            <h2 className="mb-4 font-semibold text-[#1B1C20]">
              Discover posts
            </h2>

            {loading ? (
              <p className="py-8 text-center text-[#686A72]">
                Loading posts...
              </p>
            ) : posts.length === 0 ? (
              <p className="py-8 text-center text-[#686A72]">
                No posts to discover yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-4">
                {posts.map((post) => (
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
            )}
          </section>
        )}
      </div>
    </main>
  );
};

export default Search;
