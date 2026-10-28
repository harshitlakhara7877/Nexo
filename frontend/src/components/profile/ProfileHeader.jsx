import { useState } from "react";
import { Settings, Archive, Edit3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

import ProfileStats from "./ProfileStats";
import StoryArchiveDialog from "../story/StoryArchiveDialog";

const ProfileHeader = ({
  user,
  onSettings,
  onFollowersClick,
  onFollowingClick,
}) => {
  const navigate = useNavigate();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [expandedBio, setExpandedBio] = useState(false);

  const postsCount = user?.posts?.length ?? 0;
  const followersCount = user?.followers?.length ?? 0;
  const followingCount = user?.following?.length ?? 0;

  const initials = (user?.name || user?.username || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white dark:border-[#262626] dark:bg-[#121212]">
        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            {/* Identity */}
            <div className="flex items-center gap-5">
              <Avatar className="size-24 border-4 border-white shadow-sm sm:size-28 dark:border-[#262626]">
                <AvatarImage
                  src={user?.profilePicture?.url || undefined}
                  alt={user?.username || "Profile"}
                />

                <AvatarFallback className="bg-[#FFF0E8] text-2xl font-semibold text-[#FF4D00] dark:bg-[#202020]">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-[#1B1C20] dark:text-white">
                  {user?.name || user?.username}
                </h1>

                <p className="mt-1 text-sm text-[#686A72] dark:text-neutral-400">
                  @{user?.username}
                </p>

                {user?.bio && (
                  <div className="mt-3 max-w-lg">
                    <p className="text-sm leading-6 text-[#1B1C20] dark:text-neutral-200 whitespace-pre-wrap">
                      {user.bio.length > 20 && !expandedBio
                        ? `${user.bio.slice(0, 20)}...`
                        : user.bio}
                    </p>
                    {user.bio.length > 20 && (
                      <button
                        type="button"
                        onClick={() => setExpandedBio(!expandedBio)}
                        className="mt-0.5 text-xs font-semibold text-[#FF4D00] hover:underline cursor-pointer"
                      >
                        {expandedBio ? "less" : "read more"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Action Area */}
            <div className="flex flex-wrap items-center gap-2 pt-1 sm:self-start">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/profile/edit")}
                className="h-9 gap-1.5 rounded-xl border-[#E4E1DB] bg-[#F7F6F3] text-xs font-semibold text-[#1B1C20] hover:bg-[#EEECE8] dark:border-[#333333] dark:bg-[#202020] dark:text-white dark:hover:bg-[#2A2A2A]"
              >
                <Edit3 size={14} />
                Edit profile
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setArchiveOpen(true)}
                className="h-9 gap-1.5 rounded-xl border-[#E4E1DB] bg-[#F7F6F3] text-xs font-semibold text-[#1B1C20] hover:bg-[#EEECE8] dark:border-[#333333] dark:bg-[#202020] dark:text-white dark:hover:bg-[#2A2A2A]"
              >
                <Archive size={14} />
                View archive
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={onSettings}
                aria-label="Open settings"
                title="Settings"
                className="size-9 rounded-xl p-0 text-[#686A72] hover:bg-[#F7F6F3] hover:text-[#1B1C20] dark:text-neutral-400 dark:hover:bg-[#202020] dark:hover:text-white"
              >
                <Settings size={20} strokeWidth={1.8} />
              </Button>
            </div>
          </div>
        </div>

        <ProfileStats
          postsCount={postsCount}
          followersCount={followersCount}
          followingCount={followingCount}
          onFollowersClick={onFollowersClick}
          onFollowingClick={onFollowingClick}
        />
      </section>

      {/* Story Archive Dialog */}
      <StoryArchiveDialog
        isOpen={archiveOpen}
        onClose={() => setArchiveOpen(false)}
      />
    </>
  );
};

export default ProfileHeader;
