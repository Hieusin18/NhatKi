const EVENTS = {
  CONNECT: "connection",
  DISCONNECT: "disconnect",
  SHARE_CAPTURE: "share-capture",
  NEW_CAPTURE: "new-capture",
  PRESENCE: "presence",
  ONLINE_LIST: "online-list"
};

const SOCKET_EVENTS = {
  ROOM_JOINED: "room:joined",
  PRESENCE_ONLINE: "presence:online",
  PRESENCE_OFFLINE: "presence:offline"
};

module.exports = {
  EVENTS,
  SOCKET_EVENTS
};
