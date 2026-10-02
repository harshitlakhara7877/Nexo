import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getMessage, sendMessage } from "../controllers/messageController.js";

const router = express.Router();

router.post("/send/:id", authMiddleware, sendMessage);
router.get("/all/:id", authMiddleware, getMessage);

export default router;