import Story from "../models/Story.js";
import User from "../models/User.js";
import {
  deleteMediaFromCloudinary,
  uploadMediaToCloudinary,
} from "../utils/cloudinaryUpload.js";

// 24-hour expiration rule
const STORY_DURATION_MS = 24 * 60 * 60 * 1000;

export const createStory = async (req, res) => {
  try {
    const file = req.file;
    const authorId = req.id;
    const caption = typeof req.body?.caption === "string" ? req.body.caption.trim() : "";

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Media file (image or video) is required to create a story.",
      });
    }

    const isVideo = file.mimetype.startsWith("video/");
    const mediaType = isVideo ? "video" : "image";
    const resourceType = isVideo ? "video" : "image";

    const uploadResult = await uploadMediaToCloudinary(
      file.buffer,
      "nexo/stories",
      resourceType
    );

    if (!uploadResult?.secure_url || !uploadResult?.public_id) {
      throw new Error("Story upload to Cloudinary failed.");
    }

    const expiresAt = new Date(Date.now() + STORY_DURATION_MS);

    const story = await Story.create({
      author: authorId,
      media: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        mediaType,
      },
      caption,
      viewers: [],
      isArchived: false,
      expiresAt,
    });

    await story.populate("author", "username name profilePicture");

    return res.status(201).json({
      success: true,
      message: "Story created successfully.",
      story,
    });
  } catch (error) {
    console.error("Create story error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create story.",
    });
  }
};

export const getFeedStories = async (req, res) => {
  try {
    const currentUserId = req.id;
    const cutoff = new Date(Date.now() - STORY_DURATION_MS);

    const currentUser = await User.findById(currentUserId)
      .select("following")
      .lean();

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const authorIds = [currentUserId, ...(currentUser.following || [])];

    // Exclude expired stories from active queries server-side
    const stories = await Story.find({
      author: { $in: authorIds },
      createdAt: { $gt: cutoff },
      isArchived: false,
    })
      .populate("author", "username name profilePicture")
      .populate("viewers.user", "username name profilePicture")
      .sort({ createdAt: 1 })
      .lean();

    // Group stories by author
    const groupsMap = new Map();

    for (const story of stories) {
      const authorId = String(story.author?._id);
      if (!groupsMap.has(authorId)) {
        groupsMap.set(authorId, {
          author: story.author,
          stories: [],
          isOwn: authorId === String(currentUserId),
          hasUnviewed: false,
        });
      }

      const group = groupsMap.get(authorId);
      group.stories.push(story);

      const viewedByMe = (story.viewers || []).some(
        (v) => String(v.user?._id || v.user) === String(currentUserId)
      );

      if (!viewedByMe && !group.isOwn) {
        group.hasUnviewed = true;
      }
    }

    // Sort: Current user first, then users with unviewed stories, then rest
    const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => {
      if (a.isOwn) return -1;
      if (b.isOwn) return 1;
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    return res.status(200).json({
      success: true,
      stories: sortedGroups,
      storyGroups: sortedGroups,
    });
  } catch (error) {
    console.error("Get feed stories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load stories.",
    });
  }
};

export const getArchivedStories = async (req, res) => {
  try {
    const currentUserId = req.id;
    const cutoff = new Date(Date.now() - STORY_DURATION_MS);

    // Archive is accessible only to the owner
    const stories = await Story.find({
      author: currentUserId,
      $or: [{ createdAt: { $lte: cutoff } }, { isArchived: true }],
    })
      .populate("author", "username name profilePicture")
      .populate("viewers.user", "username name profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      stories,
    });
  } catch (error) {
    console.error("Get archived stories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load archived stories.",
    });
  }
};

export const viewStory = async (req, res) => {
  try {
    const currentUserId = req.id;
    const { id } = req.params;

    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found.",
      });
    }

    const alreadyViewed = (story.viewers || []).some(
      (v) => String(v.user) === String(currentUserId)
    );

    if (!alreadyViewed) {
      story.viewers.push({
        user: currentUserId,
        viewedAt: new Date(),
      });
      await story.save();
    }

    return res.status(200).json({
      success: true,
      message: "Story viewed.",
    });
  } catch (error) {
    console.error("View story error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record story view.",
    });
  }
};

export const archiveStory = async (req, res) => {
  try {
    const currentUserId = req.id;
    const { id } = req.params;

    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found.",
      });
    }

    if (String(story.author) !== String(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: "You can only archive your own stories.",
      });
    }

    story.isArchived = true;
    await story.save();

    return res.status(200).json({
      success: true,
      message: "Story archived.",
    });
  } catch (error) {
    console.error("Archive story error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to archive story.",
    });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const currentUserId = req.id;
    const { id } = req.params;

    const story = await Story.findById(id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found.",
      });
    }

    if (String(story.author) !== String(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own stories.",
      });
    }

    if (story.media?.publicId) {
      const resourceType = story.media.mediaType === "video" ? "video" : "image";
      await deleteMediaFromCloudinary(story.media.publicId, resourceType).catch((err) =>
        console.error("Cloudinary story deletion error:", err)
      );
    }

    await Story.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Story deleted successfully.",
    });
  } catch (error) {
    console.error("Delete story error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete story.",
    });
  }
};

export const likeStory = async (req, res) => {
  try {
    const currentUserId = req.id;
    const { id } = req.params;

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found.",
      });
    }

    const likes = story.likes || [];
    const isLiked = likes.some(
      (userId) => String(userId) === String(currentUserId)
    );

    if (isLiked) {
      story.likes = likes.filter(
        (userId) => String(userId) !== String(currentUserId)
      );
    } else {
      story.likes.push(currentUserId);
    }

    await story.save();

    return res.status(200).json({
      success: true,
      message: isLiked ? "Story unliked." : "Story liked.",
      isLiked: !isLiked,
      likeCount: story.likes.length,
    });
  } catch (error) {
    console.error("Like story error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update story like.",
    });
  }
};
