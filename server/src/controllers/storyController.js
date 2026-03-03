import Story from "../models/Story.js";
import FollowRequest from "../models/FollowRequest.js";
import { uploadBuffer } from "../utils/uploadToCloudinary.js";

const expiry = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

export const createStory = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Story image is required" });

    const uploaded = await uploadBuffer(req.file.buffer, "social/stories");
    const story = await Story.create({
      author: req.user._id,
      mediaUrl: uploaded.secure_url,
      mediaPublicId: uploaded.public_id,
      expiresAt: expiry()
    });

    const populated = await story.populate("author", "username avatarUrl");
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

export const activeStories = async (req, res, next) => {
  try {
    await Story.deleteMany({ expiresAt: { $lt: new Date() } });

    const accepted = await FollowRequest.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: "accepted"
    }).lean();

    const ids = new Set([String(req.user._id)]);
    accepted.forEach((f) => {
      ids.add(String(f.requester));
      ids.add(String(f.recipient));
    });

    const stories = await Story.find({
      author: { $in: Array.from(ids) },
      expiresAt: { $gt: new Date() }
    })
      .sort({ createdAt: -1 })
      .populate("author", "username avatarUrl");

    res.json(stories);
  } catch (error) {
    next(error);
  }
};
