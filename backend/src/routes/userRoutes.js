import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getUserProfile } from "../controllers/userController.js";

const router = express.Router();

console.log("authmiddleware is checking ");
router.get("/me", authMiddleware, getUserProfile);

export default router;