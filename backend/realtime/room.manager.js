const { SOCKET_EVENTS } = require('./events');

class RoomManager {
  static instance = null;

  userSocketsMap = new Map();
  groupUsersMap = new Map();
  userIdToUsernameMap = new Map();
  disconnectTimeoutsMap = new Map();

  constructor() {}

  static getInstance() {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  handleJoinRoom(socket, io, userId, username, groupId) {
    if (this.disconnectTimeoutsMap.has(userId)) {
      console.log(`[RoomManager] User ${userId} reconnected within grace period. Cancelling offline timeout.`);
      clearTimeout(this.disconnectTimeoutsMap.get(userId));
      this.disconnectTimeoutsMap.delete(userId);
    }

    const roomName = `room:${groupId}`;
    socket.join(roomName);
    console.log(`[RoomManager] Socket ${socket.id} joined room: ${roomName}`);

    if (!this.userSocketsMap.has(userId)) {
      this.userSocketsMap.set(userId, new Set());
    }
    const userSockets = this.userSocketsMap.get(userId);
    const isFirstDevice = userSockets.size === 0;
    userSockets.add(socket.id);

    if (!this.groupUsersMap.has(groupId)) {
      this.groupUsersMap.set(groupId, new Set());
    }
    this.groupUsersMap.get(groupId).add(userId);

    this.userIdToUsernameMap.set(userId, username);

    socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
      success: true,
      room_id: groupId,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });

    if (isFirstDevice) {
      console.log(`[RoomManager] User ${userId} (${username}) is now ONLINE.`);
      io.to(roomName).emit(SOCKET_EVENTS.PRESENCE_ONLINE, {
        user_id: userId,
        username: username,
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleDisconnect(socket, io, userId, username, groupId) {
    const activeSockets = this.userSocketsMap.get(userId);
    if (activeSockets) {
      activeSockets.delete(socket.id);

      if (activeSockets.size === 0) {
        console.log(`[RoomManager] User ${userId} has no active devices. Starting 5s grace period timer...`);

        const timeout = setTimeout(() => {
          const currentSockets = this.userSocketsMap.get(userId);
          if (!currentSockets || currentSockets.size === 0) {
            console.log(`[RoomManager] User ${userId} grace period expired. User is now OFFLINE.`);

            const groupUsers = this.groupUsersMap.get(groupId);
            if (groupUsers) {
              groupUsers.delete(userId);
              if (groupUsers.size === 0) {
                this.groupUsersMap.delete(groupId);
              }
            }

            const roomName = `room:${groupId}`;
            io.to(roomName).emit(SOCKET_EVENTS.PRESENCE_OFFLINE, {
              user_id: userId,
              username: username,
              timestamp: new Date().toISOString(),
            });

            this.userSocketsMap.delete(userId);
            this.userIdToUsernameMap.delete(userId);
            this.disconnectTimeoutsMap.delete(userId);
          }
        }, 5000);

        this.disconnectTimeoutsMap.set(userId, timeout);
      }
    }
  }

  getOnlineUsers(groupId) {
    const onlineUserIds = this.groupUsersMap.get(groupId) || new Set();
    return Array.from(onlineUserIds).map((uId) => ({
      user_id: uId,
      username: this.userIdToUsernameMap.get(uId) || 'Unknown User',
      last_active: new Date().toISOString(),
    }));
  }
}

module.exports = {
  RoomManager
};
