import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import {
  getMe,
  updateMe,
  searchUsers,
  getFriends,
  getProfile,
  requestFollow,
  respondFollowRequest,
  pendingRequests,
  uploadMyAvatar
} from "../controllers/userController.js";

const router = Router();

router.use(requireUser);
router.get("/me", getMe);
router.patch("/me", updateMe);
router.post("/me/avatar", upload.single("image"), uploadMyAvatar);
router.get("/search", searchUsers);
router.get("/friends", getFriends);
router.get("/profile/:username", getProfile);
router.post("/follow/:userId", requestFollow);
router.post("/follow/respond/:requestId", respondFollowRequest);
router.get("/follow/pending", pendingRequests);

export default router;
