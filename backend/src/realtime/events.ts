export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  ROOM_JOINED: 'room:joined',
  PHOTO_NEW: 'photo:new',
  PHOTO_SYNC: 'photo:sync',
  PHOTO_SYNC_RESPONSE: 'photo:sync_response',
  PRESENCE_ONLINE: 'presence:online',
  PRESENCE_OFFLINE: 'presence:offline',
  PRESENCE_GET_LIST: 'presence:get_list',
  PRESENCE_LIST: 'presence:list',
};
export type SocketEventsType = typeof SOCKET_EVENTS;
