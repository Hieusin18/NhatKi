import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export interface JwtUserPayload {
  user_id: string;
  username: string;
  group_id: string;
  [key: string]: any;
}

export interface CustomSocketData {
  userId: string;
  username: string;
  groupId: string;
}

export interface CaptureBroadcastData {
  photo_id: string;
  url: string;
  owner_id: string;
  owner_name: string;
  group_id: string;
  uploaded_at: string;
}

export class SocketService {
  private static instance: SocketService | null = null;
  private io: Server | null = null;

  // In-memory maps for Online Presence tracking
  private userSocketsMap = new Map<string, Set<string>>(); // User_ID -> Set of active Socket_IDs
  private groupUsersMap = new Map<string, Set<string>>(); // Group_ID -> Set of online User_IDs
  private userIdToUsernameMap = new Map<string, string>(); // User_ID -> last recorded username
  private disconnectTimeoutsMap = new Map<string, NodeJS.Timeout>(); // User_ID -> Disconnect Grace Period timeout

  private constructor() {}

  // Singleton instance getter
  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  // Initialize the Socket.io Server with HTTP Server
  public init(httpServer: HttpServer): Server {
    if (this.io) {
      console.warn('[SocketService] Socket.io server has already been initialized.');
      return this.io;
    }

    console.log('[SocketService] Initializing Socket.io server...');

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
          console.error('[SocketService] Auth error: No token provided.');
          return next(new Error('Authentication error: No token provided.'));
        }

        // Support both "Bearer <token>" and raw token formats
        const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
        const secret = process.env.JWT_SECRET || 'supersecretkey';

        const decoded = jwt.verify(tokenString, secret) as JwtUserPayload;

        if (!decoded.user_id || !decoded.group_id) {
          console.error('[SocketService] Auth error: Token is missing user_id or group_id.');
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
        console.error(`[SocketService] Auth error verification failed: ${err.message}`);
        next(new Error(`Authentication error: ${err.message}`));
      }
    });

    // Connection handler
    this.io.on('connection', (socket: Socket) => {
      const { userId, username, groupId } = socket.data as CustomSocketData;

      console.log(`[SocketService] Client connected: user_id=${userId}, username=${username}, group_id=${groupId}, socket_id=${socket.id}`);

      // 1. Cancel disconnect timeout if user reconnected within the 5s grace period
      if (this.disconnectTimeoutsMap.has(userId)) {
        console.log(`[SocketService] User ${userId} reconnected within grace period. Cancelling offline timeout.`);
        clearTimeout(this.disconnectTimeoutsMap.get(userId));
        this.disconnectTimeoutsMap.delete(userId);
      }

      // Auto-join the isolated room for this group
      const roomName = `room:${groupId}`;
      socket.join(roomName);
      console.log(`[SocketService] Socket ${socket.id} joined room: ${roomName}`);

      // 2. Register active socket for the user
      if (!this.userSocketsMap.has(userId)) {
        this.userSocketsMap.set(userId, new Set());
      }
      const userSockets = this.userSocketsMap.get(userId)!;
      const isFirstDevice = userSockets.size === 0;
      userSockets.add(socket.id);

      // Register user under the group
      if (!this.groupUsersMap.has(groupId)) {
        this.groupUsersMap.set(groupId, new Set());
      }
      this.groupUsersMap.get(groupId)!.add(userId);

      // Save/update username mapping
      this.userIdToUsernameMap.set(userId, username);

      // Emit room:joined event to the connecting client
      socket.emit('room:joined', {
        success: true,
        room_id: groupId,
        user_id: userId,
        timestamp: new Date().toISOString(),
      });

      // 3. Broadcast presence:online if this is the user's first device online
      if (isFirstDevice && this.io) {
        console.log(`[SocketService] User ${userId} (${username}) is now ONLINE.`);
        this.io.to(roomName).emit('presence:online', {
          user_id: userId,
          username: username,
          timestamp: new Date().toISOString(),
        });
      }

      // Handle synchronization of missed photos during temporary offline disconnect
      socket.on('photo:sync', (payload: { last_sync_time: string }) => {
        console.log(`[SocketService] Client ${socket.id} (user_id=${userId}) requested photo sync from: ${payload?.last_sync_time}`);

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
        socket.emit('photo:sync_response', {
          photos: mockPhotos,
        });
      });

      // Handle presence:get_list to retrieve current active group members
      socket.on('presence:get_list', () => {
        console.log(`[SocketService] Client ${socket.id} (user_id=${userId}) requested online presence list for group: ${groupId}`);
        
        const onlineUserIds = this.groupUsersMap.get(groupId) || new Set<string>();
        const onlineUsers = Array.from(onlineUserIds).map((uId) => ({
          user_id: uId,
          username: this.userIdToUsernameMap.get(uId) || 'Unknown User',
          last_active: new Date().toISOString(),
        }));

        socket.emit('presence:list', {
          room_id: groupId,
          online_users: onlineUsers,
        });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`[SocketService] Client disconnected: socket_id=${socket.id}, user_id=${userId}, reason=${reason}`);
        const activeSockets = this.userSocketsMap.get(userId);
        if (activeSockets) {
          activeSockets.delete(socket.id);

          // If no active connections remain for this user, start 5s grace period
          if (activeSockets.size === 0) {
            console.log(`[SocketService] User ${userId} has no active devices. Starting 5s grace period timer...`);
            const timeout = setTimeout(() => {
              // Double check if user is still offline (no new sockets connected in the meantime)
              const currentSockets = this.userSocketsMap.get(userId);
              if (!currentSockets || currentSockets.size === 0) {
                console.log(`[SocketService] User ${userId} grace period expired. User is now OFFLINE.`);
                
                // Remove user from the group's online list
                const groupUsers = this.groupUsersMap.get(groupId);
                if (groupUsers) {
                  groupUsers.delete(userId);
                  if (groupUsers.size === 0) {
                    this.groupUsersMap.delete(groupId);
                  }
                }

                // Broadcast presence:offline to the room
                this.io?.to(roomName).emit('presence:offline', {
                  user_id: userId,
                  username: username,
                  timestamp: new Date().toISOString(),
                });

                // Clear from in-memory tracking maps
                this.userSocketsMap.delete(userId);
                this.userIdToUsernameMap.delete(userId);
                this.disconnectTimeoutsMap.delete(userId);
              }
            }, 5000); // 5 seconds Grace Period

            this.disconnectTimeoutsMap.set(userId, timeout);
          }
        }
      });

      // Handle socket error events
      socket.on('error', (error) => {
        console.error(`[SocketService] Socket error on client ${socket.id} (user_id=${userId}):`, error);
      });
    });

    return this.io;
  }

  // Broadcast a new image upload to all active members in the room (optionally excluding the uploader's socket)
  public broadcastNewCapture(data: CaptureBroadcastData, excludeSocketId?: string): void {
    if (!this.io) {
      console.error('[SocketService] Cannot broadcast. Socket.io is not initialized.');
      return;
    }

    const roomName = `room:${data.group_id}`;
    console.log(`[SocketService] Broadcasting 'photo:new' to room ${roomName} (excludeSocketId: ${excludeSocketId || 'none'})`);

    if (excludeSocketId) {
      this.io.to(roomName).except(excludeSocketId).emit('photo:new', data);
    } else {
      this.io.to(roomName).emit('photo:new', data);
    }
  }

  // Helper method to get the active Server instance
  public getIO(): Server {
    if (!this.io) {
      throw new Error('[SocketService] Socket.io has not been initialized. Call init() first.');
    }
    return this.io;
  }
}
