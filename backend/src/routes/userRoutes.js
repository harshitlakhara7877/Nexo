import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { editProfile, getUserbyUsername, getUserProfile } from "../controllers/userController.js";


const router = express.Router();

console.log("authmiddleware is checking ");
router.get("/me", authMiddleware, getUserProfile);
router.put("/me", authMiddleware, upload.single("profilePicture"), editProfile);
router.get("/:username", authMiddleware, getUserbyUsername);
export default router;