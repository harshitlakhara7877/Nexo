
import User from "../models/User.js";
import Post from "../models/Post.js";

// Search users by username or name
export const searchUsers = async (req, res) => {
  try {
    const q = req.query.q?.trim();

    if (!q) {
      return res.status(200).json({
        success: true,
        users: [],
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ],
    })
      .select("username name profilePicture")
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Search users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search users",
    });
  }
};

// Recent image posts from users other than the current user
export const discoverPosts = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 12));

    const posts = await Post.find({
      author: { $ne: req.id },
      "image.url": { $exists: true, $ne: "" },
    })
      .populate("author", "username name profilePicture")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      posts,
      page,
      hasMore: posts.length === limit,
    });
  } catch (error) {
    console.error("Discover posts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load discover posts",
    });
  }
};
