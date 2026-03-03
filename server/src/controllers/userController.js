import User from "../models/User.js";
import FollowRequest from "../models/FollowRequest.js";
import { emitToUser } from "../socket/index.js";
import { uploadBuffer } from "../utils/uploadToCloudinary.js";

const normalizeUsername = (raw) =>
  String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 20);

export const getMe = async (req, res) => {
  res.json(req.user);
};

export const uploadMyAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Avatar image is required" });

    const uploaded = await uploadBuffer(req.file.buffer, "social/avatars");
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatarUrl: uploaded.secure_url } },
      { new: true }
    );

    res.json({ avatarUrl: user.avatarUrl, user });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { bio, fullName, isPrivate, username, bioPromptDone } = req.body;
    const update = {
      bio: bio ?? req.user.bio,
      fullName: fullName ?? req.user.fullName,
      isPrivate: isPrivate ?? req.user.isPrivate
    };

    if (typeof username === "string") {
      const normalized = normalizeUsername(username);
      if (normalized.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }

      const exists = await User.findOne({ username: normalized, _id: { $ne: req.user._id } });
      if (exists) {
        return res.status(409).json({ message: "Username already taken" });
      }

      update.username = normalized;
      update.usernameSet = true;
    }

    if (typeof bio === "string" && bio.trim().length > 0) {
      update.bio = bio.trim();
      update.bioPromptDone = true;
    }

    if (typeof bioPromptDone === "boolean") {
      update.bioPromptDone = bioPromptDone;
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req, res, next) => {
  try {
    const q = req.query.q || "";
    const users = await User.find({ username: { $regex: q, $options: "i" } }).limit(20);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getFriends = async (req, res, next) => {
  try {
    const rels = await FollowRequest.find({
      status: "accepted",
      $or: [{ requester: req.user._id }, { recipient: req.user._id }]
    }).populate("requester recipient", "username avatarUrl fullName");

    const map = new Map();
    rels.forEach((rel) => {
      const friend = String(rel.requester._id) === String(req.user._id) ? rel.recipient : rel.requester;
      map.set(String(friend._id), friend);
    });

    res.json(Array.from(map.values()));
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const relation = await FollowRequest.findOne({
      $or: [
        { requester: req.user._id, recipient: user._id },
        { requester: user._id, recipient: req.user._id }
      ]
    });

    res.json({ user, relation });
  } catch (error) {
    next(error);
  }
};

export const requestFollow = async (req, res, next) => {
  try {
    const recipient = await User.findById(req.params.userId);
    if (!recipient) return res.status(404).json({ message: "User not found" });
    if (String(recipient._id) === String(req.user._id)) return res.status(400).json({ message: "Cannot follow yourself" });

    const direct = await FollowRequest.findOne({ requester: req.user._id, recipient: recipient._id });
    const reverse = await FollowRequest.findOne({ requester: recipient._id, recipient: req.user._id });

    const alreadyFriends =
      direct?.status === "accepted" ||
      reverse?.status === "accepted";
    if (alreadyFriends) {
      return res.status(400).json({ message: "You are already connected as friends" });
    }

    if (direct?.status === "pending") {
      return res.status(409).json({ message: "Follow request already pending" });
    }

    const status = recipient.isPrivate ? "pending" : "accepted";
    let doc;
    if (direct) {
      direct.status = status;
      await direct.save();
      doc = direct;
    } else {
      doc = await FollowRequest.create({
        requester: req.user._id,
        recipient: recipient._id,
        status
      });
    }

    emitToUser(String(recipient._id), "follow:update", {
      type: status === "pending" ? "follow_request" : "new_follower",
      from: req.user
    });

    emitToUser(String(req.user._id), "follow:update", { type: "request_status", status, recipientId: recipient._id });
    res.json(doc);
  } catch (error) {
    next(error);
  }
};

export const respondFollowRequest = async (req, res, next) => {
  try {
    const { action } = req.body;
    if (!["accepted", "rejected"].includes(action)) return res.status(400).json({ message: "Invalid action" });

    const request = await FollowRequest.findById(req.params.requestId).populate("requester recipient");
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (String(request.recipient._id) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });
    if (request.status !== "pending") return res.status(400).json({ message: "Request already handled" });

    request.status = action;
    await request.save();

    emitToUser(String(request.requester._id), "follow:update", {
      type: "request_response",
      status: action,
      by: req.user
    });

    emitToUser(String(req.user._id), "follow:update", { type: "request_handled", requestId: request._id, status: action });

    res.json(request);
  } catch (error) {
    next(error);
  }
};

export const pendingRequests = async (req, res, next) => {
  try {
    const data = await FollowRequest.find({ recipient: req.user._id, status: "pending" }).populate("requester", "username avatarUrl fullName");
    res.json(data);
  } catch (error) {
    next(error);
  }
};
