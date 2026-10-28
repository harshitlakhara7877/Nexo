import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  archiveStory,
  createStory,
  deleteStory,
  getArchivedStories,
  getFeedStories,
  viewStory,
  likeStory,
} from "../controllers/storyController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/create", upload.single("media"), createStory);
router.get("/feed", getFeedStories);
router.get("/archive", getArchivedStories);
router.post("/:id/view", viewStory);
router.post("/:id/like", likeStory);
router.patch("/:id/archive", archiveStory);
router.delete("/:id", deleteStory);

export default router;
