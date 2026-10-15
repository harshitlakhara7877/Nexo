import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { deleteConversationForMe, getConversations, getMessage, markConversationRead, reportUser, searchMessagePeople, sendMessage } from "../controllers/messageController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/conversations", getConversations);
router.get("/people", searchMessagePeople);

router.post("/send/:id", sendMessage);
router.get("/all/:id", getMessage);
router.patch("/read/:id", markConversationRead);
router.delete("/conversations/with/:id",deleteConversationForMe);

router.post("/report/:id", reportUser);

export default router;