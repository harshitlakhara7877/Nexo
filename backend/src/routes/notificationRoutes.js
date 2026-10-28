import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(authMiddleware);

// Register specific paths before the parameterized route.
router.get("/unread-count", getUnreadNotificationCount);
router.patch("/read-all", markAllNotificationsRead);

router.get("/", getNotifications);
router.patch("/:id/read", markNotificationRead);

export default router;

