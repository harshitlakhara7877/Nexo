import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import api from "@/services/api";

export default function OtherProfile() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/user/${username}`);

        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Failed to load profile"
          );
        }

        setUser(response.data.user);

        // User posts will be connected through the
        // appropriate public-post endpoint.
        // We don't use /post/posts because that endpoint
        // currently returns the logged-in user's posts.
        setPosts([]);
      } catch (error) {
        console.error("Fetch profile error:", error);

        toast.error(
          error.response?.data?.message ||
            "Failed to load profile"
        );

        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username, navigate]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F6F3]">
        <Loader2
          size={30}
          className="animate-spin text-[#FF4D00]"
        />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const profileImage = user.profilePicture?.url;

  return (
    <main className="min-h-screen bg-[#F7F6F3] px-4 py-6">
      <div className="mx-auto w-full max-w-4xl">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#686A72] transition hover:bg-white hover:text-[#1B1C20]"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Profile Header */}
        <section className="rounded-2xl border border-[#E4E1DB] bg-white p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="shrink-0">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={user.username}
                  className="h-28 w-28 rounded-full object-cover ring-4 ring-[#FFF0E9]"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#FFF0E9] text-3xl font-semibold text-[#FF4D00]">
                  {user.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-[#1B1C20]">
                  {user.name || user.username}
                </h1>

                {/* Follow button comes in Phase 11 */}
                <button
                  type="button"
                  disabled
                  className="rounded-xl bg-[#F7F6F3] px-5 py-2 text-sm font-semibold text-[#9A9CA3]"
                >
                  Follow
                </button>
              </div>

              <p className="mb-3 text-sm text-[#686A72]">
                @{user.username}
              </p>

              {user.bio && (
                <p className="max-w-xl text-sm leading-6 text-[#1B1C20]">
                  {user.bio}
                </p>
              )}

              {/* Stats */}
              <div className="mt-5 flex items-center gap-6">
                <div>
                  <p className="text-lg font-bold text-[#1B1C20]">
                    {user.posts?.length || 0}
                  </p>
                  <p className="text-xs text-[#686A72]">
                    Posts
                  </p>
                </div>

                <div>
                  <p className="text-lg font-bold text-[#1B1C20]">
                    {user.followers?.length || 0}
                  </p>
                  <p className="text-xs text-[#686A72]">
                    Followers
                  </p>
                </div>

                <div>
                  <p className="text-lg font-bold text-[#1B1C20]">
                    {user.following?.length || 0}
                  </p>
                  <p className="text-xs text-[#686A72]">
                    Following
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Posts */}
        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#1B1C20]">
              Posts
            </h2>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-[#E4E1DB] bg-white px-6 py-12 text-center">
              <p className="text-sm text-[#686A72]">
                No posts yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {posts.map((post) => (
                <button
                  key={post._id}
                  type="button"
                  onClick={() => navigate(`/post/${post._id}`)}
                  className="aspect-square overflow-hidden rounded-xl bg-[#F7F6F3]"
                >
                  <img
                    src={post.image?.url}
                    alt={post.caption || "Post"}
                    className="h-full w-full object-cover transition duration-200 hover:scale-105"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}