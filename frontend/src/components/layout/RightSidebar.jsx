import React, { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useNavigate } from "react-router-dom";
import SuggestedUser from "./SuggestedUser";
import api from "@/services/api";

const RightSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const [followingLoading, setFollowingLoading] = useState(false);

  const handleFollow = async () => {
    if (!user?._id || followingLoading) return;

    // Don't show a Follow button for your own profile.

    try {
      setFollowingLoading(true);

      const response = await followOrUnfollow(user._id);

      console.log("Follow response:", response);

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to update follow status"
        );
      }

      setIsFollowing(Boolean(response.isFollowing));

      if (typeof response.followersCount === "number") {
        setFollowerCount(response.followersCount);
      } else {
        // Fallback if the backend doesn't return followersCount.
        setFollowerCount((count) =>
          Math.max(0, count + (response.isFollowing ? 1 : -1))
        );
      }

      toast.success(
        response.isFollowing ? "Following successfully" : "Unfollowed successfully"
      );
    } catch (error) {
      console.error("Follow/Unfollow error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update follow status"
      );
    } finally {
      setFollowingLoading(false);
    }
  };

  return (
    <div className="top-0 fixed right-6 h-screen w-100 bg-[#FAFAFA] dark:bg-black px-5 py-7 text-[#1B1C20] dark:text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
           type="button"
           onClick={() => navigate("/profile")}
           className="cursor-pointer">
            <Avatar className="size-11">
            <AvatarImage src={user?.profilePicture?.url} alt="auth_image" />
            <AvatarFallback className="dark:bg-[#2A180E] dark:text-[#FF4D00]">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          </button>

          <div>
            <button
            type="button"
            onClick={() => navigate("/profile")}
            className="cursor-pointer hover:text-orange-600 hover:font-semibold">
              <h1 className="font-semibold text-sm">{user?.username}</h1>
            </button>
            <p className="text-xs text-[#686A72] dark:text-neutral-400">{user?.bio}</p>
          </div>
        </div>


          <button
          type="button"
          onClick={() => navigate("/profile/edit")}
          className="text-orange-500 font-semibold hover:font-bold cursor-pointer text-sm">
            Edit
          </button>
      </div>

      <SuggestedUser />
    </div>

  );
};

export default RightSidebar;
