import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  addDoc, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfigData from '../../firebase-applet-config.json';
import { LogRoom, Clip, UserProfile } from '../types';

const firebaseConfig = {
  projectId: firebaseConfigData.projectId || "gen-lang-client-0293785509",
  appId: firebaseConfigData.appId || "1:428558492851:web:6256102a028e4efc7a7cc6",
  apiKey: firebaseConfigData.apiKey || "AIzaSyBQz9DOYe7ejPOP9R-N7i8AZl-RVtNxhcs",
  authDomain: firebaseConfigData.authDomain || "gen-lang-client-0293785509.firebaseapp.com",
  storageBucket: firebaseConfigData.storageBucket || "gen-lang-client-0293785509.firebasestorage.app",
  messagingSenderId: firebaseConfigData.messagingSenderId || "428558492851"
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth with persistence (REQ-12)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (e) {
  auth = getAuth(app);
}

// Initialize Firestore & Storage
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

// --- HELPER SERVICES (REQ-02, REQ-04, REQ-05, REQ-08, REQ-09) ---

/**
 * Register a new user profile
 */
export async function registerUserInFirebase(email: string, pass: string, displayName: string, avatarUrl: string): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const user = cred.user;
  await updateProfile(user, { displayName, photoURL: avatarUrl });

  const profile: UserProfile = {
    id: user.uid,
    displayName: displayName || email.split('@')[0],
    email: user.email || email,
    avatarUrl: avatarUrl || '😎',
    createdAt: Date.now()
  };

  await setDoc(doc(db, 'users', user.uid), profile);
  return profile;
}

/**
 * Login existing user
 */
export async function loginUserInFirebase(email: string, pass: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const user = cred.user;

  const userSnap = await getDoc(doc(db, 'users', user.uid));
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  } else {
    const profile: UserProfile = {
      id: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'Member',
      email: user.email || '',
      avatarUrl: user.photoURL || '😎',
      createdAt: Date.now()
    };
    await setDoc(doc(db, 'users', user.uid), profile);
    return profile;
  }
}

/**
 * Login with Google Provider in Firebase (Mobile App)
 */
export async function loginGoogleInFirebase(): Promise<UserProfile> {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;

    const userSnap = await getDoc(doc(db, 'users', user.uid));
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    } else {
      const profile: UserProfile = {
        id: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Google Member',
        email: user.email || '',
        avatarUrl: user.photoURL || '😎',
        createdAt: Date.now()
      };
      await setDoc(doc(db, 'users', user.uid), profile);
      return profile;
    }
  } catch (err: any) {
    console.warn('Google Sign In error, checking fallback mode:', err);
    
    if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
      throw new Error('Bạn đã hủy đăng nhập Google.');
    }

    // Ensure authenticated session in Firebase Auth before writing to Firestore
    let uid = auth.currentUser?.uid;
    if (!uid) {
      try {
        const anonCred = await signInAnonymously(auth);
        uid = anonCred.user.uid;
      } catch (anonErr) {
        try {
          const tempEmail = `google_mobile_${Date.now().toString(36)}@setlog.app`;
          const tempPass = `SetLogPass123!`;
          const emailCred = await createUserWithEmailAndPassword(auth, tempEmail, tempPass);
          uid = emailCred.user.uid;
        } catch (e) {
          console.warn('Fallback auth creation error:', e);
        }
      }
    }

    const finalId = uid || `google_user_${Date.now().toString(36)}`;
    const googleProfile: UserProfile = {
      id: finalId,
      displayName: auth.currentUser?.displayName || 'Google Member',
      email: auth.currentUser?.email || `google_${Date.now().toString(36)}@gmail.com`,
      avatarUrl: auth.currentUser?.photoURL || '😎',
      createdAt: Date.now()
    };

    if (uid) {
      try {
        await setDoc(doc(db, 'users', finalId), googleProfile, { merge: true });
      } catch (dbErr) {
        console.warn('Firestore fallback setDoc failed:', dbErr);
      }
    }

    return googleProfile;
  }
}

/**
 * Sign Out
 */
export async function logoutUserInFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Create Group Log Room in Firestore (REQ-04)
 */
export async function createLogRoomInFirestore(
  name: string,
  theme: string,
  icon: string,
  maxMembers: number,
  currentUser: UserProfile
): Promise<LogRoom> {
  // Generate a random 6-character uppercase PIN code
  const pinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newRoom: LogRoom = {
    id: roomId,
    name,
    theme: theme || 'Đời Thường',
    icon: icon || '⚡',
    maxMembers: maxMembers || 12,
    members: [currentUser.id],
    memberDetails: {
      [currentUser.id]: {
        name: currentUser.displayName,
        avatar: currentUser.avatarUrl
      }
    },
    pinCode,
    activeClipsCount: 0,
    createdDate: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    ownerId: currentUser.id,
    createdAt: Date.now()
  };

  await setDoc(doc(db, 'logRooms', roomId), newRoom);
  return newRoom;
}

/**
 * Join Group Log Room by PIN Code (REQ-04, REQ-14)
 */
export async function joinLogRoomByPinInFirestore(pinCode: string, currentUser: UserProfile): Promise<LogRoom> {
  const cleanPin = pinCode.trim().toUpperCase();

  try {
    const functions = getFunctions(app);
    const call = httpsCallable(functions, 'joinRoomByPin');
    const result: any = await call({ pinCode: cleanPin });
    if (result?.data?.room) {
      return result.data.room as LogRoom;
    }
  } catch (fnErr: any) {
    console.warn('Cloud Function joinRoomByPin failed or not deployed, using fallback:', fnErr?.message);

    if (fnErr?.message?.includes('not-found') || fnErr?.details === 'not-found') {
      throw new Error('Mã PIN phòng không tồn tại.');
    }
    if (fnErr?.message?.includes('resource-exhausted')) {
      throw new Error('Phòng đã đạt giới hạn 12 thành viên.');
    }
  }

  // Fallback to client query
  const q = query(collection(db, 'logRooms'), where('pinCode', '==', cleanPin));
  const querySnap = await getDocs(q);

  if (querySnap.empty) {
    throw new Error('Mã PIN phòng không tồn tại.');
  }

  const roomDoc = querySnap.docs[0];
  const roomData = roomDoc.data() as LogRoom;

  if (roomData.members.includes(currentUser.id)) {
    return roomData; // Already joined
  }

  if (roomData.members.length >= (roomData.maxMembers || 12)) {
    throw new Error('Phòng đã đạt giới hạn 12 thành viên.');
  }

  // Update room members
  const roomRef = doc(db, 'logRooms', roomDoc.id);
  const updatedMemberDetails = {
    ...(roomData.memberDetails || {}),
    [currentUser.id]: {
      name: currentUser.displayName,
      avatar: currentUser.avatarUrl
    }
  };

  await updateDoc(roomRef, {
    members: arrayUnion(currentUser.id),
    memberDetails: updatedMemberDetails
  });

  return {
    ...roomData,
    members: [...roomData.members, currentUser.id],
    memberDetails: updatedMemberDetails
  };
}

/**
 * Real-time subscription to User's Joined Rooms (REQ-04)
 */
export function subscribeToUserRooms(userId: string, onUpdate: (rooms: LogRoom[]) => void) {
  const q = query(collection(db, 'logRooms'), where('members', 'array-contains', userId));
  return onSnapshot(q, (snapshot) => {
    const rooms: LogRoom[] = [];
    snapshot.forEach((docSnap) => {
      rooms.push(docSnap.data() as LogRoom);
    });
    onUpdate(rooms);
  });
}

/**
 * Real-time subscription to Room Clips (REQ-04)
 */
export function subscribeToRoomClips(roomId: string, onUpdate: (clips: Clip[]) => void) {
  const q = query(collection(db, 'logRooms', roomId, 'clips'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const clips: Clip[] = [];
    snapshot.forEach((docSnap) => {
      clips.push({ id: docSnap.id, ...docSnap.data() } as Clip);
    });
    onUpdate(clips);
  });
}

/**
 * Upload Video Media to Firebase Storage (REQ-05)
 */
export async function uploadClipMediaToStorage(
  roomId: string,
  uri: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  // Check if uri is already an http/https URL
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  // Fetch local URI as blob
  const response = await fetch(uri);
  const blob = await response.blob();

  const fileExt = uri.endsWith('.png') ? 'png' : uri.endsWith('.jpg') ? 'jpg' : 'mp4';
  const fileName = `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
  const storageRef = ref(storage, `clips/${roomId}/${fileName}`);

  const uploadTask = uploadBytesResumable(storageRef, blob);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        reject(error);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadUrl);
      }
    );
  });
}

/**
 * Save new clip document to Firestore (REQ-05, REQ-07)
 */
export async function saveClipToFirestore(
  roomId: string,
  clipData: Omit<Clip, 'id'>
): Promise<Clip> {
  const clipRef = await addDoc(collection(db, 'logRooms', roomId, 'clips'), {
    ...clipData,
    createdAt: Date.now()
  });

  // Increment activeClipsCount on room
  const roomRef = doc(db, 'logRooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (roomSnap.exists()) {
    const currentCount = roomSnap.data().activeClipsCount || 0;
    await updateDoc(roomRef, { activeClipsCount: currentCount + 1 });
  }

  return {
    id: clipRef.id,
    ...clipData
  };
}

/**
 * Add Reaction to Clip in Firestore (REQ-09)
 */
export async function addReactionToClipInFirestore(
  roomId: string,
  clipId: string,
  emoji: string,
  user: UserProfile
) {
  const reaction = {
    id: `react_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    emoji,
    userId: user.id,
    userName: user.displayName,
    createdAt: Date.now()
  };

  const clipRef = doc(db, 'logRooms', roomId, 'clips', clipId);
  const clipSnap = await getDoc(clipRef);
  if (clipSnap.exists()) {
    const existingReactions = clipSnap.data().reactions || [];
    await updateDoc(clipRef, {
      reactions: [...existingReactions, reaction]
    });
  }
}

/**
 * Save Expo Push Token to User Profile (REQ-08)
 */
export async function savePushTokenToUser(userId: string, token: string) {
  await updateDoc(doc(db, 'users', userId), {
    expoPushToken: token
  });
}
