import { Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

import ProfileStats from "./ProfileStats";

const ProfileHeader = ({ user, onEditProfile }) => {
  const postsCount = user?.posts?.length ?? 0;
  const followersCount = user?.followers?.length ?? 0;
  const followingCount = user?.following?.length ?? 0;

  const initials = (
    user?.name ||
    user?.username ||
    "U"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white">
      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          
          {/* Identity */}
          <div className="flex items-center gap-5">
            <Avatar className="size-24 border-4 border-white shadow-sm sm:size-28">
              <AvatarImage
                src={user?.profilePicture || undefined}
                alt={user?.username || "Profile"}
              />

              <AvatarFallback className="bg-[#FFF0E8] text-2xl font-semibold text-[#FF4D00]">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-[#1B1C20]">
                {user?.name || user?.username}
              </h1>

              <p className="mt-1 text-sm text-[#686A72]">
                @{user?.username}
              </p>

              {user?.bio && (
                <p className="mt-3 max-w-lg text-sm leading-6 text-[#1B1C20]">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <Button
            variant="outline"
            onClick={onEditProfile}
            className="w-fit border-[#FF4D00] text-[#FF4D00] hover:bg-[#FFF0E8] hover:text-[#FF4D00]"
          >
            Edit Profile
          </Button>
        </div>
      </div>

      <ProfileStats
        postsCount={postsCount}
        followersCount={followersCount}
        followingCount={followingCount}
      />
    </section>
  );
};

export default ProfileHeader;