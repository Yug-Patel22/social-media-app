import Post from "../models/Post.js";
import FollowRequest from "../models/FollowRequest.js";
import { uploadBuffer } from "../utils/uploadToCloudinary.js";

const visibleAuthorIds = async (userId) => {
  const accepted = await FollowRequest.find({
    $or: [{ requester: userId }, { recipient: userId }],
    status: "accepted"
  }).lean();

  const ids = new Set([String(userId)]);
  accepted.forEach((rel) => {
    ids.add(String(rel.requester));
    ids.add(String(rel.recipient));
  });

  return Array.from(ids);
};

export const createPost = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Image is required" });

    const uploaded = await uploadBuffer(req.file.buffer, "social/posts");
    const post = await Post.create({
      author: req.user._id,
      caption: req.body.caption || "",
      imageUrl: uploaded.secure_url,
      imagePublicId: uploaded.public_id
    });

    const populated = await post.populate("author", "username avatarUrl");
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

export const feedPosts = async (req, res, next) => {
  try {
    const ids = await visibleAuthorIds(req.user._id);
    const posts = await Post.find({ author: { $in: ids } })
      .sort({ createdAt: -1 })
      .populate("author", "username avatarUrl fullName")
      .populate("comments.user", "username avatarUrl")
      .limit(50);

    res.json(posts);
  } catch (error) {
    next(error);
  }
};

export const myPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .populate("author", "username avatarUrl fullName")
      .limit(100);

    res.json(posts);
  } catch (error) {
    next(error);
  }
};

export const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const uid = String(req.user._id);
    const idx = post.likes.findIndex((id) => String(id) === uid);
    if (idx >= 0) post.likes.splice(idx, 1);
    else post.likes.push(req.user._id);

    await post.save();
    res.json({ likes: post.likes.length, liked: idx < 0 });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user: req.user._id, text: req.body.text || "" });
    await post.save();

    const updated = await Post.findById(post._id).populate("comments.user", "username avatarUrl");
    res.json(updated.comments.at(-1));
  } catch (error) {
    next(error);
  }
};
