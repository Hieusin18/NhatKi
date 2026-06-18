class SocketService {
  static onlineCache = new Map();

  static addUserConnection(groupId, userId, socketId) {
    if (!this.onlineCache.has(groupId)) {
      this.onlineCache.set(groupId, new Map());
    }

    const groupConnections = this.onlineCache.get(groupId);

    if (!groupConnections.has(userId)) {
      groupConnections.set(userId, new Set());
      groupConnections.get(userId).add(socketId);
      return true;
    }

    groupConnections.get(userId).add(socketId);
    return false;
  }

  static removeUserConnection(groupId, userId, socketId) {
    const groupConnections = this.onlineCache.get(groupId);
    if (!groupConnections) {
      return false;
    }

    const userConnections = groupConnections.get(userId);
    if (!userConnections) {
      return false;
    }

    userConnections.delete(socketId);
    if (userConnections.size === 0) {
      groupConnections.delete(userId);

      if (groupConnections.size === 0) {
        this.onlineCache.delete(groupId);
      }

      return true;
    }

    return false;
  }

  static getOnlineUsers(groupId) {
    const groupConnections = this.onlineCache.get(groupId);
    if (!groupConnections) {
      return [];
    }

    return Array.from(groupConnections.keys());
  }
}

module.exports = {
  SocketService
};
