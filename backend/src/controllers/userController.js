import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinaryUpload.js";

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