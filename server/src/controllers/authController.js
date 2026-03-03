import User from "../models/User.js";

const normalizeUsername = (raw) =>
  String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 20);

const getUniqueUsername = async (base, clerkId) => {
  let candidate = base;
  let i = 1;
  while (await User.findOne({ username: candidate, clerkId: { $ne: clerkId } })) {
    candidate = `${base}${i++}`;
  }
  return candidate;
};

export const syncProfile = async (req, res, next) => {
  try {
    const { username, fullName, avatarUrl } = req.body;

    const existing = await User.findOne({ clerkId: req.clerkId });
    if (existing) {
      existing.fullName = fullName || existing.fullName;
      existing.avatarUrl = avatarUrl || existing.avatarUrl;
      await existing.save();
      return res.json(existing);
    }

    const normalized = normalizeUsername(username);
    const base = normalized || `user_${req.clerkId.slice(-6)}`;
    const unique = await getUniqueUsername(base, req.clerkId);

    const user = await User.create({
      clerkId: req.clerkId,
      username: unique,
      usernameSet: Boolean(normalized),
      fullName: fullName || "",
      avatarUrl: avatarUrl || ""
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};
