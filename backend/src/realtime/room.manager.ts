import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from './events';

export class RoomManager {
  private static instance: RoomManager | null = null;

  // In-memory maps for Online Presence tracking
  private userSocketsMap = new Map<string, Set<string>>(); // User_ID -> Set of Socket_IDs
  private groupUsersMap = new Map<string, Set<string>>();   // Group_ID -> Set of User_IDs
  private userIdToUsernameMap = new Map<string, string>();  // User_ID -> last known Username
  private disconnectTimeoutsMap = new Map<string, NodeJS.Timeout>(); // User_ID -> Grace Period Timeout handle

  private constructor() {}

  // Singleton instance getter
  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  // Handle Room joining & Connection Presence registration
  public handleJoinRoom(socket: Socket, io: Server, userId: string, username: string, groupId: string) {
    // 1. Cancel disconnect timeout if user reconnected within the 5s grace period
    if (this.disconnectTimeoutsMap.has(userId)) {
      console.log(`[RoomManager] User ${userId} reconnected within grace period. Cancelling offline timeout.`);
      clearTimeout(this.disconnectTimeoutsMap.get(userId)!);
      this.disconnectTimeoutsMap.delete(userId);
    }

    // Auto-join the isolated room for this group
    const roomName = `room:${groupId}`;
    socket.join(roomName);
    console.log(`[RoomManager] Socket ${socket.id} joined room: ${roomName}`);

    // 2. Register active socket for the user
    if (!this.userSocketsMap.has(userId)) {
      this.userSocketsMap.set(userId, new Set<string>());
    }
    const userSockets = this.userSocketsMap.get(userId)!;
    const isFirstDevice = userSockets.size === 0;
    userSockets.add(socket.id);

    // Register user under the group
    if (!this.groupUsersMap.has(groupId)) {
      this.groupUsersMap.set(groupId, new Set<string>());
    }
    this.groupUsersMap.get(groupId)!.add(userId);

    // Save/update username mapping
    this.userIdToUsernameMap.set(userId, username);

    // Emit room:joined event to the connecting client
    socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
      success: true,
      room_id: groupId,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });

    // 3. Broadcast presence:online if this is the user's first device online
    if (isFirstDevice) {
      console.log(`[RoomManager] User ${userId} (${username}) is now ONLINE.`);
      io.to(roomName).emit(SOCKET_EVENTS.PRESENCE_ONLINE, {
        user_id: userId,
        username: username,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Handle socket disconnection & Grace Period Offline timer
  public handleDisconnect(socket: Socket, io: Server, userId: string, username: string, groupId: string) {
    const activeSockets = this.userSocketsMap.get(userId);
    if (activeSockets) {
      activeSockets.delete(socket.id);

      // If no active connections remain for this user, start 5s grace period
      if (activeSockets.size === 0) {
        console.log(`[RoomManager] User ${userId} has no active devices. Starting 5s grace period timer...`);

        const timeout = setTimeout(() => {
          // Double check if user is still offline (no new sockets connected in the meantime)
          const currentSockets = this.userSocketsMap.get(userId);
          if (!currentSockets || currentSockets.size === 0) {
            console.log(`[RoomManager] User ${userId} grace period expired. User is now OFFLINE.`);

            // Remove user from the group's online list
            const groupUsers = this.groupUsersMap.get(groupId);
            if (groupUsers) {
              groupUsers.delete(userId);
              if (groupUsers.size === 0) {
                this.groupUsersMap.delete(groupId);
              }
            }

            // Broadcast presence:offline to the room
            const roomName = `room:${groupId}`;
            io.to(roomName).emit(SOCKET_EVENTS.PRESENCE_OFFLINE, {
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
  }

  // Get list of online users in a group
  public getOnlineUsers(groupId: string) {
    const onlineUserIds = this.groupUsersMap.get(groupId) || new Set<string>();
    return Array.from(onlineUserIds).map((uId) => ({
      user_id: uId,
      username: this.userIdToUsernameMap.get(uId) || 'Unknown User',
      last_active: new Date().toISOString(),
    }));
  }
}
