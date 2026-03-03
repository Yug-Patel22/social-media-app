import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, unique: true, index: true },
    username: { type: String, unique: true, required: true, lowercase: true, trim: true },
    usernameSet: { type: Boolean, default: false },
    fullName: { type: String, default: "" },
    bio: { type: String, default: "" },
    bioPromptDone: { type: Boolean, default: false },
    avatarUrl: { type: String, default: "" },
    isPrivate: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
