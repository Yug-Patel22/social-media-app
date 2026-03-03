import { Router } from "express";
import { identifyAuth } from "../middleware/auth.js";
import { syncProfile } from "../controllers/authController.js";

const router = Router();

router.post("/sync", identifyAuth, syncProfile);

export default router;
