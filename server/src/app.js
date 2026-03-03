import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

export const createApp = () => {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: "10mb" }));

  // Default for this project: header-based dev auth via x-clerk-id.
  // Enable Clerk server middleware only if explicitly requested.
  if (process.env.USE_CLERK_SERVER_AUTH === "true") {
    app.use(clerkMiddleware());
  } else {
    console.warn("USE_CLERK_SERVER_AUTH is not true. Using header-based dev auth mode.");
  }

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/stories", storyRoutes);
  app.use("/api/chat", chatRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
