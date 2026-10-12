import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import api from "@/services/api";
import { followOrUnfollow, getUserByUsername } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { getPostsByUsername,} from "@/services/postService";

export default function OtherProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Fetch the profile
  useEffect(() => {
  let cancelled = false;

  const fetchProfile = async () => {
    if (!username) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setUser(null);
      setPosts([]);
      setIsFollowing(false);
      setFollowerCount(0);
      setFollowingCount(0);

      const [profileResponse, postsResponse] = await Promise.all([
        getUserByUsername(username),
        getPostsByUsername(username),
      ]);

      // Support both Axios responses and response.data values.
      const profileData = profileResponse?.data ?? profileResponse;
      const postsData = postsResponse?.data ?? postsResponse;

      if (!profileData?.success || !profileData?.user) {
        throw new Error(
          profileData?.message || "Failed to load profile"
        );
      }

      if (!postsData?.success || !Array.isArray(postsData.posts)) {
        throw new Error(
          postsData?.message || "Failed to load posts"
        );
      }

      if (cancelled) return;

      // Read from the normalized response data.
      const profile = profileData.user;
      const posts = postsData.posts;

      setUser(profile);
      setPosts(posts);
      setFollowerCount(profile.followers?.length || 0);
      setFollowingCount(profile.following?.length || 0);

      const currentUserId = currentUser?._id;

      const alreadyFollowing = (
        profile.followers || []
      ).some((follower) => {
        const followerId =
          typeof follower === "object" ? follower?._id : follower;

        return String(followerId) === String(currentUserId);
      });

      setIsFollowing(Boolean(alreadyFollowing));
    } catch (error) {
      if (cancelled) return;

      console.error("Fetch profile error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load profile"
      );
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  fetchProfile();

  return () => {
    cancelled = true;
  };
}, [username, currentUser?._id]);

  // Follow / Unfollow
  const handleFollow = async () => {
    if (!user?._id || followingLoading) return;

    // Don't show a Follow button for your own profile.
    if (String(user._id) === String(currentUser?._id)) return;

    try {
      setFollowingLoading(true);

      const response = await followOrUnfollow(user._id);

      console.log("Follow response:", response);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update follow status");
      }

      setIsFollowing(Boolean(response.isFollowing));

      if (typeof response.followersCount === "number") {
        setFollowerCount(response.followersCount);
      } else {
        // Fallback if the backend doesn't return followersCount.
        setFollowerCount((count) =>
          Math.max(0, count + (response.isFollowing ? 1 : -1)),
        );
      }

      toast.success(
        response.isFollowing
          ? "Following successfully"
          : "Unfollowed successfully",
      );
    } catch (error) {
      console.error("Follow/Unfollow error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update follow status",
      );
    } finally {
      setFollowingLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F6F3]">
        <Loader2 size={30} className="animate-spin text-[#FF4D00]" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F6F3]">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#1B1C20]">
            Profile not found
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 rounded-full bg-[#FF4D00] px-5 py-2 text-sm font-medium text-white hover:bg-[#E64400]"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  const profileImage = user.profilePicture?.url;
  const isOwnProfile = String(user._id) === String(currentUser?._id);

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
                  alt={user.username || "User"}
                  className="h-28 w-28 rounded-full object-cover ring-4 ring-[#FFF0E9]"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#FFF0E9] text-3xl font-semibold text-[#FF4D00]">
                  {user.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-[#1B1C20]">
                  {user.name || user.username}
                </h1>

                {!isOwnProfile && (
                  <button
                    type="button"
                    disabled={followingLoading}
                    onClick={handleFollow}
                    className={`inline-flex min-w-20 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isFollowing
                        ? "border border-[#E4E1DB] bg-white text-[#1B1C20] hover:bg-[#F7F6F3]"
                        : "bg-[#FF4D00] text-white hover:bg-[#E64400]"
                    }`}
                  >
                    {followingLoading && (
                      <Loader2 size={15} className="animate-spin" />
                    )}
                    {followingLoading
                      ? "Please wait"
                      : isFollowing
                        ? "Following"
                        : "Follow"}
                  </button>
                )}
              </div>

              <p className="mb-3 text-sm text-[#686A72]">@{user.username}</p>

              {user.bio && (
                <p className="max-w-xl whitespace-pre-wrap text-sm leading-6 text-[#1B1C20]">
                  {user.bio}
                </p>
              )}

              {/* Stats */}
              <div className="mt-5 flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-lg font-bold text-[#1B1C20]">
                    {user.posts?.length || 0}
                  </p>
                  <p className="text-xs text-[#686A72]">Posts</p>
                </div>

                <div>
                  <p className="text-lg font-bold text-[#1B1C20]">
                    {followerCount}
                  </p>
                  <p className="text-xs text-[#686A72]">Followers</p>
                </div>

                <div>
                  <p className="text-lg font-bold text-[#1B1C20]">
                    {followingCount}
                  </p>
                  <p className="text-xs text-[#686A72]">Following</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Posts */}
        <ProfileTabs
          posts={posts}
          showLikedTab={false}
          showCreateButton={false}
        />
      </div>
    </main>
  );
}
