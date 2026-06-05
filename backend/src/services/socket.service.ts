export class SocketService {
  private static onlineCache = new Map<string, Set<string>>();

  public static addUserConnection(userId: string, socketId: string): boolean {
    if (!this.onlineCache.has(userId)) {
      this.onlineCache.set(userId, new Set());
      this.onlineCache.get(userId)!.add(socketId);
      return true;
    }
    this.onlineCache.get(userId)!.add(socketId);
    return false;
  }

  public static removeUserConnection(userId: string, socketId: string): boolean {
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

  public static getOnlineUsers(): string[] {
    return Array.from(this.onlineCache.keys());
  }
}
