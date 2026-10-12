import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";
import { getCurrentUser } from "../services/userService";
import {
  getUserPosts,
  getLikedPosts,
} from "../services/postService";

import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileTabs from "../components/profile/ProfileTabs";

const Profile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(user);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoading(true);

        const [
          profileResponse,
          postsResponse,
          likedPostsResponse,
        ] = await Promise.all([
          getCurrentUser(),
          getUserPosts(),
          getLikedPosts(),
        ]);

        if (!profileResponse?.success) {
          throw new Error(
            profileResponse?.message || "Failed to load profile."
          );
        }

        if (!postsResponse?.success) {
          throw new Error(
            postsResponse?.message || "Failed to load your posts."
          );
        }

        if (!likedPostsResponse?.success) {
          throw new Error(
            likedPostsResponse?.message ||
              "Failed to load your liked posts."
          );
        }

        if (cancelled) return;

        const currentProfile = {
          ...profileResponse.user,
          posts: postsResponse.posts || [],
        };

        setProfile(currentProfile);
        setUser(currentProfile);
        setPosts(postsResponse.posts || []);
        setLikedPosts(likedPostsResponse.posts || []);
      } catch (error) {
        if (cancelled) return;

        console.error("Load profile error:", error);

        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Failed to load profile."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [setUser]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F6F3] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-64 animate-pulse rounded-2xl bg-white" />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square animate-pulse rounded-xl bg-white"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F6F3]">
        <div className="text-center">
          <p className="mb-4 text-sm text-[#686A72]">
            Unable to load your profile.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-[#FF4D00] px-5 py-2 text-sm font-semibold text-white hover:bg-[#E64400]"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F6F3] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Page heading */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1B1C20]">
            Profile
          </h1>

          <p className="mt-1 text-sm text-[#686A72]">
            Manage your profile, posts, and liked content.
          </p>
        </div>

        {/* Profile header */}
        <ProfileHeader
          user={profile}
          onSettings={() => navigate("/settings")}
        />

        {/* Reusable profile tabs */}
        <ProfileTabs
          posts={posts}
          likedPosts={likedPosts}
          showLikedTab={true}
        />
      </div>
    </main>
  );
};

export default Profile;