import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";

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

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (bio !== undefined) {
      user.bio = bio.trim();
    }

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "nexo/profile",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        uploadStream.end(req.file.buffer);
      });

      user.profilePicture = result.secure_url;
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

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
    const suggestedUsers = await User.find({
      _id: { $ne: req.id },
    }).select("-password");

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

    return res.status(200).json({
      message: "Followed successfully",
      success: true,
    });
  } catch (error) {
    console.error("Follow/unfollow error:", error);

    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};