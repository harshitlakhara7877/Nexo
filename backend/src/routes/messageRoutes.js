import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getConversations, getMessage, markConversationRead, searchMessagePeople, sendMessage } from "../controllers/messageController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/conversations", getConversations);
router.get("/people", searchMessagePeople);

router.post("/send/:id", sendMessage);
router.get("/all/:id", getMessage);
router.patch("/read/:id", markConversationRead);

export default router;