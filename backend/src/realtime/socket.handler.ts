import { Socket, Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { EVENTS } from "./events";
import { SocketService } from "../services/socket.service";

// Interface representing the JWT token payload structure
export interface JwtUserPayload {
  user_id: string;
  username: string;
  group_id: string;
  [key: string]: any;
}

// Interface for custom socket data properties in Socket.io
export interface CustomSocketData {
  userId: string;
  username: string;
  groupId: string;
}

export class SocketHandler {
  private static instance: SocketHandler | null = null;
  private io: Server | null = null;

  private constructor() {}

  // Singleton instance getter
  public static getInstance(): SocketHandler {
    if (!SocketHandler.instance) {
      SocketHandler.instance = new SocketHandler();
    }
    return SocketHandler.instance;
  }

  // Initialize the Socket.io Server with HTTP Server
  public init(httpServer: HttpServer): Server {
    if (this.io) {
      console.warn('[SocketHandler] Socket.io server has already been initialized.');
      return this.io;
    }

    console.log('[SocketHandler] Initializing Socket.io server...');

    this.io = new Server(httpServer, {
      cors: {
        origin: '*', // Allow all origins, adjust if needed for production
        methods: ['GET', 'POST'],
      },
    });

    // Register Authentication Middleware
    this.io.use((socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) {
          console.error('[SocketHandler] Auth error: No token provided.');
          return next(new Error('Authentication error: No token provided.'));
        }

        // Support both "Bearer <token>" and raw token formats
        const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
        const secret = process.env.JWT_SECRET || 'supersecretkey';

        const decoded = jwt.verify(tokenString, secret) as JwtUserPayload;

        if (!decoded.user_id || !decoded.group_id) {
          console.error('[SocketHandler] Auth error: Token is missing user_id or group_id.');
          return next(new Error('Authentication error: Invalid token payload.'));
        }

        // Attach user info to socket session data for later use
        socket.data = {
          userId: decoded.user_id,
          username: decoded.username || '',
          groupId: decoded.group_id,
        } as CustomSocketData;

        next();
      } catch (err: any) {
        console.error(`[SocketHandler] Auth verification failed: ${err.message}`);
        next(new Error(`Authentication error: ${err.message}`));
      }
    });

    // Connection handler
    this.io.on(EVENTS.CONNECT, (socket: Socket) => {
      console.log(`[SocketHandler] Client connected: socket_id=${socket.id}`);
      registerSocketHandlers(this.io!, socket);
    });

    return this.io;
  }

  // Broadcast helper in case other services need it
  public broadcastNewCapture(data: any, excludeSocketId?: string): void {
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

  // Helper method to get the active Server instance
  public getIO(): Server {
    if (!this.io) {
      throw new Error('[SocketHandler] Socket.io has not been initialized. Call init() first.');
    }
    return this.io;
  }
}

export const registerSocketHandlers = (io: Server, socket: Socket) => {
  const { userId, groupId } = socket.data;
  socket.join(groupId);
  const isFirstDevice = SocketService.addUserConnection(userId, socket.id);
  if (isFirstDevice) socket.to(groupId).emit(EVENTS.PRESENCE, { userId, status: "online" });
  socket.emit(EVENTS.ONLINE_LIST, SocketService.getOnlineUsers());
  socket.on(EVENTS.SHARE_CAPTURE, (data: { imageId: string; imageUrl: string }) => {
    const payload = { groupId, imageId: data.imageId, senderId: userId, imageUrl: data.imageUrl, createdAt: new Date().toISOString() };
    io.to(groupId).emit(EVENTS.NEW_CAPTURE, payload);
  });
  socket.on(EVENTS.DISCONNECT, () => {
    const isCompletelyOffline = SocketService.removeUserConnection(userId, socket.id);
    if (isCompletelyOffline) io.to(groupId).emit(EVENTS.PRESENCE, { userId, status: "offline" });
  });
};
