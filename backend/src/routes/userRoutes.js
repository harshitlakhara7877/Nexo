import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { editProfile, followOrUnfollow, getSuggesetedUsers, getUserbyUsername, getUserProfile } from "../controllers/userController.js";


const router = express.Router();

console.log("authmiddleware is checking ");
router.get("/me", authMiddleware, getUserProfile);
router.put("/me", authMiddleware, upload.single("profilePicture"), editProfile);
router.get("/:username", authMiddleware, getUserbyUsername);
router.get("/suggested", authMiddleware, getSuggesetedUsers);
router.post("/follow/:id", authMiddleware, followOrUnfollow);
export default router;