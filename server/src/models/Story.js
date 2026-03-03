import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, required: true },
    mediaPublicId: { type: String, default: "" },
    expiresAt: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

export default mongoose.model("Story", storySchema);
