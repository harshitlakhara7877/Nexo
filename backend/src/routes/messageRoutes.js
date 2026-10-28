import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  deleteConversationForMe,
  getConversations,
  getMessage,
  markConversationRead,
  reportUser,
  searchMessagePeople,
  sendMessage,
  toggleMuteConversation,
} from "../controllers/messageController.js";
import upload from "../middleware/uploadMiddleware.js";
const router = express.Router();

router.use(authMiddleware);

router.get("/conversations", getConversations);
router.get("/people", searchMessagePeople);

router.post("/send/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  sendMessage
);
router.get("/all/:id", getMessage);
router.patch("/read/:id", markConversationRead);
router.patch("/mute/:id", toggleMuteConversation);
router.delete("/conversations/with/:id",deleteConversationForMe);

router.post("/report/:id", reportUser);

export default router;