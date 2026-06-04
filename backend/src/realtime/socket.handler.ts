import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { RoomManager } from './room.manager';
import { SOCKET_EVENTS } from './events';

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

// Interface for photo broadcast payload
export interface CaptureBroadcastData {
  photo_id: string;
  url: string;
  owner_id: string;
  owner_name: string;
  group_id: string;
  uploaded_at: string;
}

export class SocketHandler {
  private static instance: SocketHandler | null = null;
  private io: Server | null = null;
  private roomManager = RoomManager.getInstance();

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
    this.io.on(SOCKET_EVENTS.CONNECTION, (socket: Socket) => {
      const { userId, username, groupId } = socket.data as CustomSocketData;

      console.log(`[SocketHandler] Client connected: user_id=${userId}, username=${username}, group_id=${groupId}, socket_id=${socket.id}`);

      // Delegate room joining and connection presence to RoomManager
      this.roomManager.handleJoinRoom(socket, this.io!, userId, username, groupId);

      // Handle synchronization of missed photos during temporary offline disconnect
      socket.on(SOCKET_EVENTS.PHOTO_SYNC, (payload: { last_sync_time: string }) => {
        console.log(`[SocketHandler] Client ${socket.id} (user_id=${userId}) requested photo sync from: ${payload?.last_sync_time}`);

        // Mock some sync photos taken in the room after the last_sync_time
        const lastSync = payload?.last_sync_time ? new Date(payload.last_sync_time) : new Date(Date.now() - 60000);
        
        const mockPhotos = [
          {
            photo_id: 'img_mock_11111',
            url: 'https://res.cloudinary.com/del4dtz6a/image/upload/v1717500000/convenience_store/mock1.jpg',
            owner_id: 'usr_mock_1',
            owner_name: 'Minh Tuấn',
            group_id: groupId,
            uploaded_at: new Date(lastSync.getTime() + 5000).toISOString(),
          },
          {
            photo_id: 'img_mock_22222',
            url: 'https://res.cloudinary.com/del4dtz6a/image/upload/v1717500000/convenience_store/mock2.jpg',
            owner_id: 'usr_mock_2',
            owner_name: 'Thanh Thủy',
            group_id: groupId,
            uploaded_at: new Date(lastSync.getTime() + 10000).toISOString(),
          },
        ];

        // Send response to the requesting client
        socket.emit(SOCKET_EVENTS.PHOTO_SYNC_RESPONSE, {
          photos: mockPhotos,
        });
      });

      // Handle presence:get_list to retrieve current active group members
      socket.on(SOCKET_EVENTS.PRESENCE_GET_LIST, () => {
        console.log(`[SocketHandler] Client ${socket.id} (user_id=${userId}) requested online presence list for group: ${groupId}`);
        
        const onlineUsers = this.roomManager.getOnlineUsers(groupId);
        socket.emit(SOCKET_EVENTS.PRESENCE_LIST, {
          room_id: groupId,
          online_users: onlineUsers,
        });
      });

      // Handle disconnection
      socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        console.log(`[SocketHandler] Client disconnected: socket_id=${socket.id}, user_id=${userId}, reason=${reason}`);
        this.roomManager.handleDisconnect(socket, this.io!, userId, username, groupId);
      });

      // Handle socket error events
      socket.on(SOCKET_EVENTS.ERROR, (error) => {
        console.error(`[SocketHandler] Socket error on client ${socket.id} (user_id=${userId}):`, error);
      });
    });

    return this.io;
  }

  // Broadcast a new image upload to all active members in the room (optionally excluding the uploader's socket)
  public broadcastNewCapture(data: CaptureBroadcastData, excludeSocketId?: string): void {
    if (!this.io) {
      console.error('[SocketHandler] Cannot broadcast. Socket.io is not initialized.');
      return;
    }

    const roomName = `room:${data.group_id}`;
    console.log(`[SocketHandler] Broadcasting 'photo:new' to room ${roomName} (excludeSocketId: ${excludeSocketId || 'none'})`);

    if (excludeSocketId) {
      this.io.to(roomName).except(excludeSocketId).emit(SOCKET_EVENTS.PHOTO_NEW, data);
    } else {
      this.io.to(roomName).emit(SOCKET_EVENTS.PHOTO_NEW, data);
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
