import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { addComment, addNewPost, bookmarkPost, deletePost, dislikePost, getAllPosts,
 getCommentsOfPost, getSinglePost, getUserPosts, likePost } from "../controllers/postController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, upload.single('image'), addNewPost);
router.get("/feed", authMiddleware, getAllPosts);
router.get("/posts", authMiddleware, getUserPosts);
router.get("/:id", authMiddleware, getSinglePost);
router.get("/:id/like", authMiddleware, likePost);
router.get("/:id/dislike", authMiddleware, dislikePost);
router.post("/:id/comment", authMiddleware, addComment);
router.get("/:id/comment/all", authMiddleware, getCommentsOfPost);
router.delete("/delete/:id", authMiddleware, deletePost);
router.post("/:id/bookmark", authMiddleware, bookmarkPost);

export default router;