import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { addComment, addNewPost, bookmarkPost, deletePost, dislikePost, getAllPosts,
 getBookmarkedPosts,
 getCommentsOfPost, getLikedPosts, getPostsByUsername, getSinglePost, getUserPosts, likePost, getPostPreview } from "../controllers/postController.js";
import upload from "../middleware/uploadMiddleware.js";
import { discoverPosts, searchPosts } from "../controllers/SearchController.js";

const router = express.Router();

router.post("/create", authMiddleware, upload.single('image'), addNewPost);
router.get("/feed", authMiddleware, getAllPosts);
router.get("/discover", authMiddleware, discoverPosts);
router.get("/search", authMiddleware, searchPosts);
router.get("/posts", authMiddleware, getUserPosts);
router.get("/liked", authMiddleware, getLikedPosts);
router.get("/bookmarked", authMiddleware, getBookmarkedPosts);
router.get("/by-user/:username", authMiddleware, getPostsByUsername);
router.get("/:id/preview", getPostPreview);
router.get("/:id/meta", getPostPreview);
router.get("/:id", (req, res, next) => {
  const userAgent = req.headers["user-agent"] || "";
  const isCrawler = /whatsapp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|redditbot|Applebot|Discordbot/i.test(
    userAgent
  );
  if (isCrawler) {
    return getPostPreview(req, res);
  }
  return authMiddleware(req, res, () => getSinglePost(req, res));
});
router.post("/:id/like", authMiddleware, likePost);
router.post("/:id/dislike", authMiddleware, dislikePost);
router.post("/:id/comment", authMiddleware, addComment);
router.get("/:id/comment/all", authMiddleware, getCommentsOfPost);
router.delete("/delete/:id", authMiddleware, deletePost);
router.post("/:id/bookmark", authMiddleware, bookmarkPost);

export default router;