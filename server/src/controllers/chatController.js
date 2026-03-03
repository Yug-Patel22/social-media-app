import Message from "../models/Message.js";
import User from "../models/User.js";
import { canUsersChat } from "../utils/social.js";
import { emitToUser } from "../socket/index.js";

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const rows = await Message.find({ $or: [{ sender: userId }, { receiver: userId }] })
      .sort({ createdAt: -1 })
      .populate("sender receiver", "username avatarUrl fullName")
      .limit(300);

    const map = new Map();
    rows.forEach((m) => {
      const other = String(m.sender._id) === String(userId) ? m.receiver : m.sender;
      if (!map.has(String(other._id))) map.set(String(other._id), { user: other, lastMessage: m });
    });

    res.json(Array.from(map.values()));
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const other = await User.findById(req.params.userId);
    if (!other) return res.status(404).json({ message: "User not found" });

    const canChat = await canUsersChat(req.user._id, other._id);
    if (!canChat) return res.status(403).json({ message: "Chat allowed only with connected followers" });

    const msgs = await Message.find({
      $or: [
        { sender: req.user._id, receiver: other._id },
        { sender: other._id, receiver: req.user._id }
      ]
    }).sort({ createdAt: 1 });

    res.json(msgs);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const other = await User.findById(req.params.userId);
    if (!other) return res.status(404).json({ message: "User not found" });

    const canChat = await canUsersChat(req.user._id, other._id);
    if (!canChat) return res.status(403).json({ message: "Chat allowed only with connected followers" });

    const msg = await Message.create({ sender: req.user._id, receiver: other._id, text: req.body.text || "" });
    const populated = await msg.populate("sender receiver", "username avatarUrl fullName");

    emitToUser(String(other._id), "chat:new_message", populated);
    emitToUser(String(req.user._id), "chat:new_message", populated);

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};
