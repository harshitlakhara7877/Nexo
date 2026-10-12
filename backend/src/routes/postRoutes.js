import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { addComment, addNewPost, bookmarkPost, deletePost, dislikePost, getAllPosts,
 getBookmarkedPosts,
 getCommentsOfPost, getLikedPosts, getPostsByUsername, getSinglePost, getUserPosts, likePost } from "../controllers/postController.js";
import upload from "../middleware/uploadMiddleware.js";
import { discoverPosts } from "../controllers/SearchController.js";

const router = express.Router();

router.post("/create", authMiddleware, upload.single('image'), addNewPost);
router.get("/feed", authMiddleware, getAllPosts);
router.get("/discover", authMiddleware, discoverPosts);
router.get("/posts", authMiddleware, getUserPosts);
router.get("/liked", authMiddleware, getLikedPosts);
router.get("/bookmarked", authMiddleware, getBookmarkedPosts);
router.get("/by-user/:username", authMiddleware, getPostsByUsername);
router.get("/:id", authMiddleware, getSinglePost);
router.post("/:id/like", authMiddleware, likePost);
router.post("/:id/dislike", authMiddleware, dislikePost);
router.post("/:id/comment", authMiddleware, addComment);
router.get("/:id/comment/all", authMiddleware, getCommentsOfPost);
router.delete("/delete/:id", authMiddleware, deletePost);
router.post("/:id/bookmark", authMiddleware, bookmarkPost);

export default router;