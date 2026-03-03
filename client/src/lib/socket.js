import { io } from "socket.io-client";

let socket;

export const connectSocket = (userId) => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      transports: ["websocket"]
    });
  }

  socket.emit("register", { userId });
  return socket;
};

export const getSocket = () => socket;
