class SocketService {
  static onlineCache = new Map();

  static addUserConnection(userId, socketId) {
    if (!this.onlineCache.has(userId)) {
      this.onlineCache.set(userId, new Set());
      this.onlineCache.get(userId).add(socketId);
      return true;
    }
    this.onlineCache.get(userId).add(socketId);
    return false;
  }

  static removeUserConnection(userId, socketId) {
    const userConnections = this.onlineCache.get(userId);
    if (userConnections) {
      userConnections.delete(socketId);
      if (userConnections.size === 0) {
        this.onlineCache.delete(userId);
        return true;
      }
    }
    return false;
  }

  static getOnlineUsers() {
    return Array.from(this.onlineCache.keys());
  }
}

module.exports = {
  SocketService
};
