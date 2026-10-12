import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { editProfile, followOrUnfollow, getSuggesetedUsers, getUserbyUsername, getUserProfile } from "../controllers/userController.js";
import { searchUsers } from "../controllers/SearchController.js";


const router = express.Router();

console.log("authmiddleware is checking ");
router.get("/me", authMiddleware, getUserProfile);
router.put("/me", authMiddleware, upload.single("profilePicture"), editProfile);
router.get("/search", authMiddleware, searchUsers);
router.get("/suggested", authMiddleware, getSuggesetedUsers);
router.get("/:username", authMiddleware, getUserbyUsername);
router.post("/:id/follow", authMiddleware, followOrUnfollow);
export default router;