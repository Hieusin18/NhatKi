export type PrivacyLevel = 'public_friends' | 'close_friends' | 'private';

export interface ActiveSession {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  ipAddress: string;
  location: string;
  lastActiveTime: number;
  isCurrent: boolean;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  bio: string;
  is2FAEnabled: boolean;
  closeFriendIds: string[];
  blockedUserIds: string[];
  qrCodeToken: string;
  createdAt: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export interface SelfieReaction {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  reactionImageUrl: string;
  createdAt: number;
}

export interface EmojiReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: number;
}

export interface MomentPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  primaryMediaUrl: string; // Front or main photo/video
  secondaryMediaUrl?: string; // Dual camera selfie or inset photo
  mediaType: 'image' | 'video_15s' | 'clip_2s';
  caption: string;
  locationName?: string;
  capturedAt: number;
  dailyPromptTime: number; // e.g. 14:30
  lateMinutes: number; // 0 if on time, >0 if late
  retakeCount: number;
  privacy: PrivacyLevel;
  storageTier: 'hot_s3' | 'cool_infrequent' | 'glacier_cold';
  reactions: EmojiReaction[];
  selfieReactions: SelfieReaction[];
  comments: Comment[];
  seenBy: { userId: string; userName: string; avatar: string; timestamp: number }[];
}

export interface MediaJobStatus {
  jobId: string;
  filename: string;
  stage: 'queued' | 'downloading' | 'compressing_sharp' | 'transcoding_ffmpeg' | 'generating_thumbnails' | 'uploading_cdn' | 'completed';
  progress: number;
  outputUrls: {
    thumbnail: string;
    medium: string;
    full: string;
    hlsPlaylist?: string;
  };
}

export interface AppNotification {
  id: string;
  type: 'daily_prompt' | 'friend_request' | 'reaction' | 'comment' | 'late_warning';
  title: string;
  body: string;
  read: boolean;
  timestamp: number;
  actionUrl?: string;
}

export interface ApiEndpointSpec {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description: string;
  requestBodyExample?: object;
  responseExample: object;
}
