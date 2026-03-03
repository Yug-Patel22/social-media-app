import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { getConversations, getMessages, sendMessage } from "../controllers/chatController.js";

const router = Router();

router.use(requireUser);
router.get("/conversations", getConversations);
router.get("/:userId", getMessages);
router.post("/:userId", sendMessage);

export default router;
