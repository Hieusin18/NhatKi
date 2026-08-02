export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  expoPushToken?: string;
  createdAt?: number;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  role?: 'owner' | 'member';
  joinedAt?: number;
}

export interface LogRoom {
  id: string;
  name: string;
  theme: string;
  icon: string;
  maxMembers: number;
  members: string[]; // Member UIDs
  memberDetails?: Record<string, { name: string; avatar: string }>;
  pinCode: string;
  activeClipsCount: number;
  createdDate: string;
  ownerId: string;
  createdAt?: number;
}

export interface ClipReaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  createdAt: number;
}

export interface ClipComment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar: string;
  createdAt: number;
}

export interface Clip {
  id: string;
  logId: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  hourSlot: string; // e.g. '07:00', '11:00', '15:00', '18:00'
  videoUrl: string;
  caption: string;
  theme: string;
  createdAt: number;
  reactions?: ClipReaction[];
  comments?: ClipComment[];
}
