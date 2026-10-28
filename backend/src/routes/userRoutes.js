import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  blockUser,
  editProfile,
  followOrUnfollow,
  getBlockedUsers,
  getShareSuggestions,
  getSuggesetedUsers,
  getUserbyUsername,
  getUserFollowers,
  getUserFollowing,
  getUserProfile,
  removeFollower,
} from "../controllers/userController.js";
import { searchUsers } from "../controllers/SearchController.js";

const router = express.Router();

router.get("/me", authMiddleware, getUserProfile);
router.put("/me", authMiddleware, upload.single("profilePicture"), editProfile);
router.get("/search", authMiddleware, searchUsers);
router.get("/share-suggestions", authMiddleware, getShareSuggestions);
router.get("/suggested", authMiddleware, getSuggesetedUsers);
router.get("/blocked", authMiddleware, getBlockedUsers);
router.post("/block/:id", authMiddleware, blockUser);

// Followers and Following dialog endpoints
router.get("/:id/followers", authMiddleware, getUserFollowers);
router.get("/:id/following", authMiddleware, getUserFollowing);
router.post("/:id/remove-follower", authMiddleware, removeFollower);

router.get("/:username", authMiddleware, getUserbyUsername);
router.post("/:id/follow", authMiddleware, followOrUnfollow);

export default router;