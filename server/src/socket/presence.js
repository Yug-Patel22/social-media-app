const onlineUsers = new Map();

export const addConnection = (userId, socketId) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
};

export const removeConnection = (socketId) => {
  for (const [userId, sockets] of onlineUsers.entries()) {
    if (sockets.has(socketId)) {
      sockets.delete(socketId);
      if (sockets.size === 0) onlineUsers.delete(userId);
      return userId;
    }
  }
  return null;
};

export const getSocketsByUser = (userId) => Array.from(onlineUsers.get(userId) || []);
export const getOnlineUserIds = () => Array.from(onlineUsers.keys());
