import { useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";
import { getCurrentUser } from "../services/userService";
import ProfileHeader from "../components/profile/ProfileHeader";

const Profile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);

        const data = await getCurrentUser();

        setProfile(data.user);
        setUser(data.user);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [setUser]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F6F3] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F6F3]">
        <p className="text-sm text-[#686A72]">
          Unable to load profile.
        </p>
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
            Manage your Nexo profile and posts.
          </p>
        </div>

        {/* Profile header */}
        <ProfileHeader
          user={profile}
          onEditProfile={() => navigate("/profile/edit")}
        />

        {/* Profile content */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white">

          {/* Tabs */}
          <div className="flex border-b border-[#EEECE8]">
            <button
              type="button"
              className="relative flex-1 py-4 text-sm font-medium text-[#FF4D00]"
            >
              Posts

              <span className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-[#FF4D00]" />
            </button>

            <button
              type="button"
              className="flex-1 py-4 text-sm font-medium text-[#9A9CA3]"
            >
              Likes
            </button>
          </div>

          {/* Posts */}
          {profile.posts?.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#FFF0E8]">
                <ImageIcon
                  size={24}
                  className="text-[#FF4D00]"
                />
              </div>

              <h2 className="text-base font-semibold text-[#1B1C20]">
                No posts yet
              </h2>

              <p className="mt-1 max-w-sm text-sm text-[#686A72]">
                Your posts will appear here once you
                start sharing with the Nexo community.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {profile.posts.map((post) => (
                <div
                  key={post}
                  className="aspect-square bg-[#EEECE8]"
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Profile;