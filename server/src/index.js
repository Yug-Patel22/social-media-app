import "dotenv/config";
import http from "http";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./socket/index.js";

const port = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);
  initSocket(server, process.env.CLIENT_URL || "http://localhost:5173");

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
