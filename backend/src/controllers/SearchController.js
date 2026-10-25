import User from "../models/User.js";
import Post from "../models/Post.js";

const DEFAULT_USER_LIMIT = 10;
const DEFAULT_POST_LIMIT = 12;
const MAX_SEARCH_LIMIT = 30;
const MAX_QUERY_LENGTH = 100;

const getPositiveInteger = (value, fallback) => {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0
    ? parsed
    : fallback;
};

const getPagination = (query, defaultLimit) => {
  const page = getPositiveInteger(query.page, 1);
  const limit = Math.min(
    MAX_SEARCH_LIMIT,
    getPositiveInteger(query.limit, defaultLimit),
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

// Treat user input as literal text, not regular-expression syntax.
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const readQuery = (value) =>
  typeof value === "string" ? value.trim() : "";

// Search people by username or display name.
export const searchUsers = async (req, res) => {
  try {
    const q = readQuery(req.query.q);
    const { page, limit, skip } = getPagination(
      req.query,
      DEFAULT_USER_LIMIT,
    );

    if (!q) {
      return res.status(200).json({
        success: true,
        users: [],
        page,
        limit,
        hasMore: false,
      });
    }

    if (q.length > MAX_QUERY_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Search query must be ${MAX_QUERY_LENGTH} characters or fewer.`,
      });
    }

    const safeQuery = escapeRegex(q);

    const users = await User.find({
      $or: [
        {
          username: {
            $regex: safeQuery,
            $options: "i",
          },
        },
        {
          name: {
            $regex: safeQuery,
            $options: "i",
          },
        },
      ],
    })
      .select("username name profilePicture")
      .skip(skip)
      .limit(limit + 1)
      .lean();

    return res.status(200).json({
      success: true,
      users: users.slice(0, limit),
      page,
      limit,
      hasMore: users.length > limit,
    });
  } catch (error) {
    console.error("Search users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search users",
    });
  }
};

// Default discovery: recent image posts by other users.
export const discoverPosts = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query,
      DEFAULT_POST_LIMIT,
    );

    const posts = await Post.find({
      author: { $ne: req.id },
      "image.url": { $exists: true, $ne: "" },
    })
      .populate("author", "username name profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1)
      .lean();

    return res.status(200).json({
      success: true,
      posts: posts.slice(0, limit),
      page,
      limit,
      hasMore: posts.length > limit,
    });
  } catch (error) {
    console.error("Discover posts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load discover posts",
    });
  }
};

// Search posts by caption.
// This is separate from discoverPosts: it uses the submitted query.
export const searchPosts = async (req, res) => {
  try {
    const q =
      typeof req.query.q === "string"
        ? req.query.q.trim()
        : "";

    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1,
    );

    const limit = Math.min(
      30,
      Math.max(
        1,
        Number.parseInt(req.query.limit, 10) || 12,
      ),
    );

    if (!q) {
      return res.status(200).json({
        success: true,
        posts: [],
        page,
        limit,
        hasMore: false,
      });
    }

    if (q.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search query must be 100 characters or fewer.",
      });
    }

    // Match the caption literally, ignoring letter case.
    const safeQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const posts = await Post.find({
      caption: {
        $regex: safeQuery,
        $options: "i",
      },
    })
      .populate("author", "username name profilePicture")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit + 1)
      .lean();

    return res.status(200).json({
      success: true,
      posts: posts.slice(0, limit),
      page,
      limit,
      hasMore: posts.length > limit,
    });
  } catch (error) {
    console.error("Search posts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search posts",
    });
  }
};