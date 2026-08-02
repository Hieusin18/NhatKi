import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot, 
  query, 
  where,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, uploadString } from 'firebase/storage';
import { getMessaging, getToken, isSupported as isMessagingSupported } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, MomentPost, FriendRequest, AppNotification, ActiveSession, MediaJobStatus } from '../types';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const storage = getStorage(app, firebaseConfig.storageBucket);

// Error Handling according to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errStr = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errStr,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  if (errStr.includes('Quota limit exceeded') || errStr.includes('RESOURCE_EXHAUSTED')) {
    console.warn('Firestore Quota Limit Reached - Fallback active:', path);
  } else {
    console.warn('Firestore Notice:', operationType, path, errStr);
  }
  return new Error(JSON.stringify(errInfo));
}

// Ensure User Profile document in Firestore
export async function syncUserProfileToFirestore(user: UserProfile): Promise<void> {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), {
      ...user,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.warn("syncUserProfileToFirestore notice:", err);
  }
}

// Fetch User Profile from Firestore
export async function fetchUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn("fetchUserProfileFromFirestore fallback:", err);
    return null;
  }
}

// Search users in Firestore by username or display name
export async function searchUsersInFirestore(searchTerm: string): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const q = query(collection(db, 'users'));
    const snap = await getDocs(q);
    const users: UserProfile[] = [];
    const term = searchTerm.toLowerCase().trim();
    snap.forEach((docSnap) => {
      const u = docSnap.data() as UserProfile;
      if (
        u.username?.toLowerCase().includes(term) ||
        u.displayName?.toLowerCase().includes(term) ||
        u.phone?.includes(term) ||
        u.email?.toLowerCase().includes(term)
      ) {
        users.push(u);
      }
    });
    return users;
  } catch (err) {
    console.warn("searchUsersInFirestore fallback:", err);
    return [];
  }
}

// Friend Requests
export function subscribeToFriendRequests(userId: string, callback: (requests: FriendRequest[]) => void) {
  const path = 'friendRequests';
  const q = query(
    collection(db, 'friendRequests'),
    where('toUserId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const requests: FriendRequest[] = [];
    snapshot.forEach((docSnap) => {
      requests.push(docSnap.data() as FriendRequest);
    });
    callback(requests);
  }, (error) => {
    console.warn("Friend requests snapshot error:", error);
  });
}

export async function sendFriendRequestToFirestore(req: FriendRequest): Promise<void> {
  const path = `friendRequests/${req.id}`;
  try {
    await setDoc(doc(db, 'friendRequests', req.id), req);
  } catch (err) {
    throw handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateFriendRequestStatusInFirestore(reqId: string, status: 'accepted' | 'rejected'): Promise<void> {
  const path = `friendRequests/${reqId}`;
  try {
    await updateDoc(doc(db, 'friendRequests', reqId), { status });
  } catch (err) {
    throw handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeToUserFriends(userId: string, callback: (friends: { id: string; name: string; username: string; avatar: string }[]) => void) {
  const friendsRef = collection(db, 'users', userId, 'friends');
  return onSnapshot(friendsRef, (snapshot) => {
    const friends: { id: string; name: string; username: string; avatar: string }[] = [];
    snapshot.forEach((docSnap) => {
      if (docSnap.id !== userId) {
        const data = docSnap.data();
        friends.push({
          id: docSnap.id,
          name: data.name || data.displayName || 'Bạn bè',
          username: data.username || docSnap.id,
          avatar: data.avatar || data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
        });
      }
    });
    callback(friends);
  }, (err) => {
    console.warn("Friends listener error:", err);
  });
}

export async function acceptFriendRequestInFirestore(req: FriendRequest, currentUser: UserProfile): Promise<void> {
  const reqPath = `friendRequests/${req.id}`;
  try {
    await updateDoc(doc(db, 'friendRequests', req.id), { status: 'accepted' });

    const friendId = req.fromUserId === currentUser.id ? req.toUserId : req.fromUserId;
    const friendName = req.fromUserId === currentUser.id ? 'Bạn bè' : req.fromUserName;
    const friendAvatar = req.fromUserId === currentUser.id ? '' : req.fromUserAvatar;

    await setDoc(doc(db, 'users', currentUser.id, 'friends', friendId), {
      id: friendId,
      name: friendName,
      username: friendId,
      avatar: friendAvatar,
      addedAt: Date.now()
    }, { merge: true });

    await setDoc(doc(db, 'users', friendId, 'friends', currentUser.id), {
      id: currentUser.id,
      name: currentUser.displayName,
      username: currentUser.username || currentUser.id,
      avatar: currentUser.avatarUrl,
      addedAt: Date.now()
    }, { merge: true });

    const sortedIds = [currentUser.id, friendId].sort();
    const chatId = `chat_${sortedIds.join('_')}`;

    await setDoc(doc(db, 'chats', chatId), {
      id: chatId,
      participants: sortedIds,
      participantNames: {
        [currentUser.id]: currentUser.displayName,
        [friendId]: friendName
      },
      participantAvatars: {
        [currentUser.id]: currentUser.avatarUrl,
        [friendId]: friendAvatar
      },
      lastMessage: 'Đã trở thành bạn bè trên SetLog! ✨',
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    throw handleFirestoreError(err, OperationType.WRITE, reqPath);
  }
}

export async function removeFriendFromFirestore(userId: string, friendId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'friends', friendId));
    await deleteDoc(doc(db, 'users', friendId, 'friends', userId));
  } catch (err) {
    console.warn("Error removing friend:", err);
  }
}

export async function createOrOpenChatInFirestore(currentUser: UserProfile, friend: { id: string; name: string; avatar: string }): Promise<string> {
  const sortedIds = [currentUser.id, friend.id].sort();
  const chatId = `chat_${sortedIds.join('_')}`;

  await setDoc(doc(db, 'chats', chatId), {
    id: chatId,
    participants: sortedIds,
    participantNames: {
      [currentUser.id]: currentUser.displayName,
      [friend.id]: friend.name
    },
    participantAvatars: {
      [currentUser.id]: currentUser.avatarUrl,
      [friend.id]: friend.avatar
    },
    lastMessage: 'Bắt đầu cuộc trò chuyện',
    updatedAt: Date.now()
  }, { merge: true });

  return chatId;
}

// Close Friends & Blocked Users on Firestore
export async function toggleCloseFriendInFirestore(userId: string, targetId: string, isClose: boolean): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      closeFriendIds: isClose ? arrayUnion(targetId) : arrayRemove(targetId)
    });
  } catch (err) {
    throw handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function toggleBlockUserInFirestore(userId: string, targetId: string, isBlocked: boolean): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      blockedUserIds: isBlocked ? arrayUnion(targetId) : arrayRemove(targetId)
    });
  } catch (err) {
    throw handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Moment Posts Real-time Subscriptions & Mutations
export function subscribeToMomentPosts(callback: (posts: MomentPost[]) => void) {
  const path = 'posts';
  const postsRef = collection(db, 'posts');
  return onSnapshot(postsRef, (snapshot) => {
    const fetchedPosts: MomentPost[] = [];
    snapshot.forEach((docSnap) => {
      fetchedPosts.push(docSnap.data() as MomentPost);
    });
    fetchedPosts.sort((a, b) => (b.capturedAt || 0) - (a.capturedAt || 0));
    callback(fetchedPosts);
  }, (error) => {
    console.warn("Moment posts listener error:", error);
  });
}

export async function saveMomentPostToFirestore(post: MomentPost): Promise<void> {
  const path = `posts/${post.id}`;
  try {
    let payload = { ...post };
    await setDoc(doc(db, 'posts', post.id), payload);
  } catch (err) {
    throw handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Media Job Logger for private background jobs
export async function logMediaJobToFirestore(job: MediaJobStatus & { userId: string }): Promise<void> {
  const path = `mediaJobs/${job.jobId}`;
  try {
    await setDoc(doc(db, 'mediaJobs', job.jobId), {
      ...job,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.warn("Media job log warning:", err);
  }
}

// FCM Push Notifications Registration
export async function registerFcmTokenForUser(userId: string): Promise<string | null> {
  try {
    const supported = await isMessagingSupported();
    if (!supported) return null;
    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BEl62iUYgUivxIkv69yViEuiBIa1-A1c...' // Default VAPID key
      });
      if (token) {
        await updateDoc(doc(db, 'users', userId), { fcmToken: token });
        return token;
      }
    }
  } catch (err) {
    console.warn("FCM Registration notice:", err);
  }
  return null;
}

export async function seedFirestoreIfEmpty(initialLogs: any[] = [], initialClips: any[] = []): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'clips'));
    if (snap.empty && initialClips.length > 0) {
      for (const clip of initialClips) {
        await setDoc(doc(db, 'clips', clip.id), clip);
      }
    }
  } catch (err) {
    console.warn("Seeding skip or error:", err);
  }
}

export function subscribeToClips(callback: (clips: any[]) => void) {
  const clipsRef = collection(db, 'clips');
  return onSnapshot(clipsRef, (snapshot) => {
    const fetchedClips: any[] = [];
    snapshot.forEach((docSnap) => {
      fetchedClips.push(docSnap.data());
    });
    fetchedClips.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(fetchedClips);
  }, (error) => {
    console.warn("Clips snapshot error:", error);
  });
}

export async function saveClipToFirestore(clipData: any): Promise<void> {
  const path = `clips/${clipData.id}`;
  try {
    await setDoc(doc(db, 'clips', clipData.id), clipData);
  } catch (err) {
    console.warn("Error saving clip to Firestore:", err);
  }
}

export async function deleteClipFromFirestore(clipId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'clips', clipId));
    await deleteDoc(doc(db, 'moments', clipId));
    await deleteDoc(doc(db, 'posts', clipId));
  } catch (err) {
    console.warn("Error deleting clip/moment from Firestore:", err);
  }
}

export async function saveSessionToFirestore(userId: string, session: ActiveSession): Promise<void> {
  const path = `users/${userId}/sessions/${session.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'sessions', session.id), session);
  } catch (err) {
    console.warn("Failed to save session:", err);
  }
}

export async function removeSessionFromFirestore(userId: string, sessionId: string): Promise<void> {
  const path = `users/${userId}/sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
  } catch (err) {
    console.warn("Failed to delete session:", err);
  }
}

export async function fetchUserSessionsFromFirestore(userId: string): Promise<ActiveSession[]> {
  const path = `users/${userId}/sessions`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'sessions'));
    const sessions: ActiveSession[] = [];
    snap.forEach((docSnap) => {
      sessions.push(docSnap.data() as ActiveSession);
    });
    return sessions;
  } catch (err) {
    console.warn("Failed to fetch sessions:", err);
    return [];
  }
}

// Real-time Chat Firestore Functions
export function subscribeToUserChats(userId: string, callback: (chats: any[]) => void) {
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('participants', 'array-contains', userId));
  return onSnapshot(q, (snapshot) => {
    const fetchedChats: any[] = [];
    snapshot.forEach((docSnap) => {
      fetchedChats.push(docSnap.data());
    });
    fetchedChats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    callback(fetchedChats);
  }, (error) => {
    console.warn("Chats snapshot error:", error);
  });
}

export function subscribeToChatMessages(chatId: string, callback: (messages: any[]) => void) {
  const messagesRef = collection(db, `chats/${chatId}/messages`);
  return onSnapshot(messagesRef, (snapshot) => {
    const fetchedMsgs: any[] = [];
    snapshot.forEach((docSnap) => {
      fetchedMsgs.push(docSnap.data());
    });
    fetchedMsgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    callback(fetchedMsgs);
  }, (error) => {
    console.warn("Messages snapshot error:", error);
  });
}

export async function markMessagesAsReadInFirestore(chatId: string, currentUserId: string): Promise<void> {
  try {
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const snapshot = await getDocs(messagesRef);
    snapshot.forEach(async (docSnap) => {
      const data = docSnap.data();
      if (data.senderId !== currentUserId && !data.read) {
        await updateDoc(doc(db, `chats/${chatId}/messages`, docSnap.id), {
          read: true,
          readAt: Date.now()
        });
      }
    });
  } catch (err) {
    console.warn("Error marking messages as read:", err);
  }
}

export async function sendMessageToFirestore(chatId: string, messageData: any, conversationData?: any): Promise<void> {
  const fullMsgData = {
    read: false,
    ...messageData
  };
  try {
    if (conversationData) {
      await setDoc(doc(db, 'chats', chatId), conversationData, { merge: true });
    } else {
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: fullMsgData.text || 'Gửi một hình ảnh',
        updatedAt: Date.now()
      });
    }
    await setDoc(doc(db, 'chats', chatId, 'messages', fullMsgData.id), fullMsgData);
  } catch (err) {
    console.warn("Failed to send message to Firestore:", err);
  }
}

// Real-time Notifications Listener
export function subscribeToUserNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
  const notifRef = collection(db, 'notifications');
  const q = query(notifRef, where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const notifs: AppNotification[] = [];
    snapshot.forEach((docSnap) => {
      notifs.push(docSnap.data() as AppNotification);
    });
    notifs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    callback(notifs);
  }, (error) => {
    console.warn("Notifications listener error:", error);
  });
}

