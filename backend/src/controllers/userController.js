import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import { createNotification } from "../utils/createNotification.js";

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user profile error:", error);

    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const editProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;

    const user = await User.findById(req.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Update name
    if (name !== undefined) {
      user.name = name.trim();
    }

    // Update bio
    if (bio !== undefined) {
      user.bio = bio.trim();
    }

    // Handle profile picture
    if (req.file) {
      const oldPublicId = user.profilePicture?.publicId;

      console.log("Uploading profile picture:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      // Upload new image
      const result = await uploadToCloudinary(
        req.file.buffer,
        "nexo/profilePictures"
      );

      // Save new image information
      user.profilePicture = {
        url: result.secure_url,
        publicId: result.public_id,
      };

      // Save MongoDB 
      await user.save();

      // Delete old image in background
      if (oldPublicId) {
        deleteFromCloudinary(oldPublicId)
          .then(() => {
            console.log("Old profile picture deleted:", oldPublicId);
          })
          .catch((error) => {
            console.error(
              "Failed to delete old profile picture:",
              error
            );
          });
      }
    } else {
      // No image change — just save profile data
      await user.save();
    }

    const updatedUser = user.toObject();
    delete updatedUser.password;

    console.log("Profile updated successfully");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Edit profile error:", error);

    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getUserbyUsername = async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();

    const user = await User.findOne({
      username
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user by username error:", error);

    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getSuggesetedUsers = async (req, res) => {
  try {
    const author = await User.findById(req.id).select("following").lean();

    if (!author) {
      return res.status(404).json({
        success: false,
        message: "User not auhtorized"
      })
    }

    const excludedIds = [req.id, ...(author.following || [])];

    const suggestedUsers = await User.find({
      _id: { $nin: excludedIds },
    }).select("username profilePicture").limit(10).lean();

    return res.status(200).json({
      success: true,
      users: suggestedUsers,
    });
  } catch (error) {
    console.error("Get suggested users error:", error);

    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const followOrUnfollow = async (req, res) => {
  try {
    const ownerId = req.id;
    const otherId = req.params.id;

    if (ownerId.toString() === otherId.toString()) {
      return res.status(400).json({
        message: "You can't follow or unfollow yourself",
        success: false,
      });
    }

    const user = await User.findById(ownerId);
    const targetUser = await User.findById(otherId);

    if (!user || !targetUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    const isFollowing = user.following.some(
      (id) => id.toString() === targetUser._id.toString()
    );

    if (isFollowing) {
      // Unfollow
      await Promise.all([
        User.updateOne(
          { _id: ownerId },
          { $pull: { following: otherId } }
        ),
        User.updateOne(
          { _id: otherId },
          { $pull: { followers: ownerId } }
        ),
      ]);


      return res.status(200).json({
        message: "Unfollowed successfully",
        success: true,
        isFollowing: false,
        followersCount: Math.max(targetUser.followers.length - 1, 0),
      });
    }

    // Follow
    await Promise.all([
      User.updateOne(
        { _id: ownerId },
        { $addToSet: { following: otherId } }
      ),
      User.updateOne(
        { _id: otherId },
        { $addToSet: { followers: ownerId } }
      ),
    ]);

    await createNotification({
        recipient: otherId,
        sender: ownerId,
        type: "follow",
        io: req.app.get("io"),
      });

    return res.status(200).json({
      message: "Followed successfully",
      success: true,
      isFollowing: true,
      followersCount: targetUser.followers.length + 1,
    });
  } catch (error) {
    console.error("Follow/unfollow error:", error);

    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getShareSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.id)
      .select("followers following")
      .lean();

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const ids = [
      ...new Set([
        ...(currentUser.followers || []).map(String),
        ...(currentUser.following || []).map(String),
      ]),
    ].filter((id) => id !== String(req.id));

    const users = await User.find({
      _id: { $in: ids },
    })
      .select("username name profilePicture")
      .limit(40)
      .lean();

    if (users.length < 12) {
      const additionalUsers = await User.find({
        _id: { $nin: [req.id, ...ids] },
      })
        .select("username name profilePicture")
        .limit(12 - users.length)
        .lean();

      users.push(...additionalUsers);
    }

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Share suggestions error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load share suggestions",
    });
  }
};

export const getUserFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id)
      ? { _id: id }
      : { username: id.toLowerCase() };

    const user = await User.findOne(query)
      .populate("followers", "username name profilePicture bio followers following")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      users: user.followers || [],
    });
  } catch (error) {
    console.error("Get user followers error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load followers.",
    });
  }
};

export const getUserFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id)
      ? { _id: id }
      : { username: id.toLowerCase() };

    const user = await User.findOne(query)
      .populate("following", "username name profilePicture bio followers following")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      users: user.following || [],
    });
  } catch (error) {
    console.error("Get user following error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load following users.",
    });
  }
};

export const blockUser = async (req, res) => {
  try {
    const ownerId = req.id;
    const targetUserId = req.params.id;

    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (String(ownerId) === String(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "You can't block yourself.",
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const user = await User.findById(ownerId);

    const isBlocked = (user.blocked || []).some(
      (id) => String(id) === String(targetUserId)
    );

    if (isBlocked) {
      // Unblock
      await User.updateOne(
        { _id: ownerId },
        { $pull: { blocked: targetUserId } }
      );

      return res.status(200).json({
        success: true,
        isBlocked: false,
      });
    }

    // Block: add to blocked list and unfollow both directions
    await Promise.all([
      User.updateOne(
        { _id: ownerId },
        {
          $addToSet: { blocked: targetUserId },
          $pull: { following: targetUserId, followers: targetUserId },
        }
      ),
      User.updateOne(
        { _id: targetUserId },
        {
          $pull: { following: ownerId, followers: ownerId },
        }
      ),
    ]);

    return res.status(200).json({
      success: true,
      isBlocked: true,
    });
  } catch (error) {
    console.error("Block user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to block/unblock user.",
    });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.id).select("blocked").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      blockedUsers: user.blocked || [],
    });
  } catch (error) {
    console.error("Get blocked users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load blocked users.",
    });
  }
};

export const removeFollower = async (req, res) => {
  try {
    const ownerId = req.id;
    const targetUserId = req.params.id;

    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    await Promise.all([
      User.findByIdAndUpdate(ownerId, {
        $pull: { followers: targetUserId },
      }),
      User.findByIdAndUpdate(targetUserId, {
        $pull: { following: ownerId },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Follower removed successfully.",
    });
  } catch (error) {
    console.error("Remove follower error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove follower.",
    });
  }
};