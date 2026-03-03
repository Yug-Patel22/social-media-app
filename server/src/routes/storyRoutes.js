import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { createStory, activeStories } from "../controllers/storyController.js";

const router = Router();

router.use(requireUser);
router.get("/", activeStories);
router.post("/", upload.single("image"), createStory);

export default router;
