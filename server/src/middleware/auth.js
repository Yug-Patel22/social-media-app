import { getAuth } from "@clerk/express";
import User from "../models/User.js";

const safeClerkUserId = (req) => {
  try {
    return getAuth(req)?.userId || null;
  } catch {
    return null;
  }
};

export const identifyAuth = (req, res, next) => {
  const clerkId = safeClerkUserId(req) || req.header("x-clerk-id") || null;

  if (!clerkId) {
    return res.status(401).json({ message: "Unauthorized. Missing Clerk identity." });
  }

  req.clerkId = clerkId;
  next();
};

export const requireUser = async (req, res, next) => {
  try {
    const clerkId = safeClerkUserId(req) || req.header("x-clerk-id");
    if (!clerkId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: "Profile not found. Sync account first." });

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
