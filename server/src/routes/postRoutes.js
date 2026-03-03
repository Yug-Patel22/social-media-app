import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { createPost, feedPosts, myPosts, toggleLike, addComment } from "../controllers/postController.js";

const router = Router();

router.use(requireUser);
router.get("/feed", feedPosts);
router.get("/me", myPosts);
router.post("/", upload.single("image"), createPost);
router.post("/:postId/like", toggleLike);
router.post("/:postId/comment", addComment);

export default router;
