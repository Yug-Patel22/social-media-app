import { Server } from "socket.io";
import { addConnection, removeConnection, getSocketsByUser, getOnlineUserIds } from "./presence.js";

let io;

export const initSocket = (httpServer, clientUrl) => {
  io = new Server(httpServer, {
    cors: { origin: clientUrl, methods: ["GET", "POST"] }
  });

  io.on("connection", (socket) => {
    socket.on("register", ({ userId }) => {
      if (!userId) return;
      socket.data.userId = userId;
      addConnection(String(userId), socket.id);
      io.emit("presence:update", { users: getOnlineUserIds() });
    });

    socket.on("chat:typing", ({ to, from }) => {
      if (!to || !from) return;
      getSocketsByUser(String(to)).forEach((sid) => {
        io.to(sid).emit("chat:typing", { from });
      });
    });

    socket.on("disconnect", () => {
      removeConnection(socket.id);
      io.emit("presence:update", { users: getOnlineUserIds() });
    });
  });

  return io;
};

export const emitToUser = (userId, event, payload) => {
  if (!io) return;
  getSocketsByUser(String(userId)).forEach((sid) => io.to(sid).emit(event, payload));
};
