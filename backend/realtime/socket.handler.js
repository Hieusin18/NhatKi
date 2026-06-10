const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { EVENTS } = require("./events");
const { SocketService } = require("../services/socket.service");

class SocketHandler {
  static instance = null;
  io = null;

  constructor() {}

  static getInstance() {
    if (!SocketHandler.instance) {
      SocketHandler.instance = new SocketHandler();
    }
    return SocketHandler.instance;
  }

  init(httpServer) {
    if (this.io) {
      console.warn('[SocketHandler] Socket.io server has already been initialized.');
      return this.io;
    }

    console.log('[SocketHandler] Initializing Socket.io server...');

    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) {
          console.error('[SocketHandler] Auth error: No token provided.');
          return next(new Error('Authentication error: No token provided.'));
        }

        const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
        const secret = process.env.JWT_SECRET || 'supersecretkey';

        const decoded = jwt.verify(tokenString, secret);

        if (!decoded.user_id || !decoded.group_id) {
          console.error('[SocketHandler] Auth error: Token is missing user_id or group_id.');
          return next(new Error('Authentication error: Invalid token payload.'));
        }

        socket.data = {
          userId: decoded.user_id,
          username: decoded.username || '',
          groupId: decoded.group_id,
        };

        next();
      } catch (err) {
        console.error(`[SocketHandler] Auth verification failed: ${err.message}`);
        next(new Error(`Authentication error: ${err.message}`));
      }
    });

    this.io.on(EVENTS.CONNECT, (socket) => {
      console.log(`[SocketHandler] Client connected: socket_id=${socket.id}`);
      registerSocketHandlers(this.io, socket);
    });

    return this.io;
  }

  broadcastNewCapture(data, excludeSocketId) {
    if (!this.io) {
      console.error('[SocketHandler] Cannot broadcast. Socket.io is not initialized.');
      return;
    }
    const roomName = data.group_id || data.groupId;
    if (excludeSocketId) {
      this.io.to(roomName).except(excludeSocketId).emit(EVENTS.NEW_CAPTURE, data);
    } else {
      this.io.to(roomName).emit(EVENTS.NEW_CAPTURE, data);
    }
  }

  getIO() {
    if (!this.io) {
      throw new Error('[SocketHandler] Socket.io has not been initialized. Call init() first.');
    }
    return this.io;
  }
}

const registerSocketHandlers = (io, socket) => {
  const { userId, groupId } = socket.data;
  socket.join(groupId);
  const isFirstDevice = SocketService.addUserConnection(userId, socket.id);
  if (isFirstDevice) socket.to(groupId).emit(EVENTS.PRESENCE, { userId, status: "online" });
  socket.emit(EVENTS.ONLINE_LIST, SocketService.getOnlineUsers());
  socket.on(EVENTS.SHARE_CAPTURE, (data) => {
    const payload = { groupId, imageId: data.imageId, senderId: userId, imageUrl: data.imageUrl, createdAt: new Date().toISOString() };
    io.to(groupId).emit(EVENTS.NEW_CAPTURE, payload);
  });
  socket.on(EVENTS.DISCONNECT, () => {
    const isCompletelyOffline = SocketService.removeUserConnection(userId, socket.id);
    if (isCompletelyOffline) io.to(groupId).emit(EVENTS.PRESENCE, { userId, status: "offline" });
  });
};

module.exports = {
  SocketHandler,
  registerSocketHandlers
};
