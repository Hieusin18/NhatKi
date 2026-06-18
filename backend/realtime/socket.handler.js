const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { EVENTS } = require("./events");
const { SocketService } = require("../services/socket.service");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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
        const secret = process.env.JWT_SECRET || 'nhatki_secret';

        const decoded = jwt.verify(tokenString, secret);

        if (!decoded.userId) {
          console.error('[SocketHandler] Auth error: Token is missing userId.');
          return next(new Error('Authentication error: Invalid token payload.'));
        }

        const groupId =
          socket.handshake.auth?.groupId ||
          socket.handshake.auth?.group_id ||
          socket.handshake.query?.groupId ||
          socket.handshake.query?.group_id ||
          null;

        socket.data = {
          userId: decoded.userId,
          username: decoded.username || '',
          groupId,
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
  const { userId } = socket.data;

  if (socket.data.groupId) {
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: String(socket.data.groupId),
        },
      },
    }).then((membership) => {
      if (membership) {
        joinGroupRoom(io, socket, socket.data.groupId);
      } else {
        console.warn(`[SocketHandler] User ${userId} unauthorized for group ${socket.data.groupId} at connection.`);
        socket.emit("join-room:error", { message: "Bạn không có quyền tham gia phòng này." });
      }
    }).catch((err) => {
      console.error(`[SocketHandler] Error verifying connection groupId: ${err.message}`);
    });
  }

  socket.on("join-room", async (payload) => {
    const groupId = typeof payload === "string" ? payload : payload?.groupId || payload?.group_id;

    if (!groupId) {
      socket.emit("join-room:error", { message: "groupId is required." });
      return;
    }

    try {
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId: String(groupId),
          },
        },
      });

      if (!membership) {
        socket.emit("join-room:error", { message: "Bạn không có quyền tham gia phòng này." });
        return;
      }

      joinGroupRoom(io, socket, groupId);
    } catch (err) {
      console.error(`Error checking membership in join-room: ${err.message}`);
      socket.emit("join-room:error", { message: "Lỗi hệ thống khi kiểm tra quyền truy cập." });
    }
  });

  socket.on(EVENTS.SHARE_CAPTURE, async (data) => {
    const groupId = data?.groupId || data?.group_id || socket.data.groupId;

    if (!groupId) {
      socket.emit("share-capture:error", { message: "Join a group before sharing capture." });
      return;
    }

    try {
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId: String(groupId),
          },
        },
      });

      if (!membership) {
        socket.emit("share-capture:error", { message: "Bạn không có quyền chia sẻ ảnh trong nhóm này." });
        return;
      }

      const payload = { groupId, imageId: data?.imageId, senderId: userId, imageUrl: data?.imageUrl, createdAt: new Date().toISOString() };
      io.to(groupId).emit(EVENTS.NEW_CAPTURE, payload);
    } catch (err) {
      console.error(`Error checking membership in share-capture: ${err.message}`);
      socket.emit("share-capture:error", { message: "Lỗi hệ thống khi kiểm tra quyền truy cập." });
    }
  });
  socket.on(EVENTS.DISCONNECT, () => {
    const groupId = socket.data.groupId;
    if (!groupId) {
      return;
    }

    const isCompletelyOffline = SocketService.removeUserConnection(groupId, userId, socket.id);
    if (isCompletelyOffline) {
      io.to(groupId).emit(EVENTS.PRESENCE, { userId, status: "offline" });
      io.to(groupId).emit(EVENTS.ONLINE_LIST, SocketService.getOnlineUsers(groupId));
    }
  });
};

const joinGroupRoom = (io, socket, groupId) => {
  const normalizedGroupId = String(groupId);

  if (socket.data.groupId === normalizedGroupId && socket.rooms.has(normalizedGroupId)) {
    return;
  }

  const previousGroupId = socket.data.groupId;
  if (previousGroupId && previousGroupId !== normalizedGroupId) {
    socket.leave(previousGroupId);

    const isOfflineInPreviousGroup = SocketService.removeUserConnection(
      previousGroupId,
      socket.data.userId,
      socket.id
    );

    if (isOfflineInPreviousGroup) {
      io.to(previousGroupId).emit(EVENTS.PRESENCE, {
        userId: socket.data.userId,
        status: "offline"
      });
    }

    io.to(previousGroupId).emit(EVENTS.ONLINE_LIST, SocketService.getOnlineUsers(previousGroupId));
  }

  socket.data.groupId = normalizedGroupId;
  socket.join(normalizedGroupId);

  const isFirstDevice = SocketService.addUserConnection(normalizedGroupId, socket.data.userId, socket.id);
  if (isFirstDevice) {
    socket.to(normalizedGroupId).emit(EVENTS.PRESENCE, {
      userId: socket.data.userId,
      status: "online"
    });
  }

  io.to(normalizedGroupId).emit(EVENTS.ONLINE_LIST, SocketService.getOnlineUsers(normalizedGroupId));
  socket.emit("join-room:success", { groupId: normalizedGroupId });
};

module.exports = {
  SocketHandler,
  registerSocketHandlers
};
