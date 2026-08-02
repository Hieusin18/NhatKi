import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, registerUserInFirebase, loginUserInFirebase, loginGoogleInFirebase, logoutUserInFirebase, createLogRoomInFirestore, joinLogRoomByPinInFirestore, subscribeToUserRooms, subscribeToRoomClips, uploadClipMediaToStorage, saveClipToFirestore, addReactionToClipInFirestore } from '../lib/firebase';
import { UserProfile, LogRoom, Clip } from '../types';

interface AppContextType {
  currentUser: UserProfile | null;
  authLoading: boolean;
  userRooms: LogRoom[];
  currentRoom: LogRoom | null;
  currentRoomClips: Clip[];
  toastMessage: string | null;
  showToast: (msg: string) => void;
  setCurrentRoom: (room: LogRoom | null) => void;
  register: (email: string, pass: string, name: string, avatar: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  createRoom: (name: string, theme: string, icon: string, maxMembers: number) => Promise<LogRoom>;
  joinRoomByPin: (pinCode: string) => Promise<LogRoom>;
  postClip: (roomId: string, videoUri: string, hourSlot: string, caption: string, theme: string, onProgress?: (p: number) => void) => Promise<void>;
  addReaction: (roomId: string, clipId: string, emoji: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [userRooms, setUserRooms] = useState<LogRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<LogRoom | null>(null);
  const [currentRoomClips, setCurrentRoomClips] = useState<Clip[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // 1. Listen to Firebase Auth state change (REQ-01 & REQ-02)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as UserProfile);
          } else {
            const profile: UserProfile = {
              id: firebaseUser.uid,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member',
              email: firebaseUser.email || '',
              avatarUrl: firebaseUser.photoURL || '😎',
              createdAt: Date.now()
            };
            setCurrentUser(profile);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setCurrentUser(null);
        setUserRooms([]);
        setCurrentRoom(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen to real-time User Log Rooms when logged in (REQ-04)
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeRooms = subscribeToUserRooms(currentUser.id, (rooms) => {
      setUserRooms(rooms);
      // Update current room if it exists in the list
      if (currentRoom) {
        const updatedCurrent = rooms.find((r) => r.id === currentRoom.id);
        if (updatedCurrent) {
          setCurrentRoom(updatedCurrent);
        }
      }
    });

    return () => unsubscribeRooms();
  }, [currentUser?.id]);

  // 3. Listen to real-time Clips of Current Room (REQ-04)
  useEffect(() => {
    if (!currentRoom) {
      setCurrentRoomClips([]);
      return;
    }

    const unsubscribeClips = subscribeToRoomClips(currentRoom.id, (clips) => {
      setCurrentRoomClips(clips);
    });

    return () => unsubscribeClips();
  }, [currentRoom?.id]);

  const register = async (email: string, pass: string, name: string, avatar: string) => {
    const profile = await registerUserInFirebase(email, pass, name, avatar);
    setCurrentUser(profile);
    showToast(`Chào mừng ${profile.displayName}! 🎉`);
  };

  const login = async (email: string, pass: string) => {
    const profile = await loginUserInFirebase(email, pass);
    setCurrentUser(profile);
    showToast(`Đăng nhập thành công! Chào ${profile.displayName} 👋`);
  };

  const loginWithGoogle = async () => {
    const profile = await loginGoogleInFirebase();
    setCurrentUser(profile);
    showToast(`Đăng nhập Google thành công! Chào ${profile.displayName} 🚀`);
  };

  const logout = async () => {
    await logoutUserInFirebase();
    setCurrentUser(null);
    setCurrentRoom(null);
    showToast('Đã đăng xuất tài khoản!');
  };

  const createRoom = async (name: string, theme: string, icon: string, maxMembers: number) => {
    if (!currentUser) throw new Error('Vui lòng đăng nhập!');
    const newRoom = await createLogRoomInFirestore(name, theme, icon, maxMembers, currentUser);
    setCurrentRoom(newRoom);
    showToast(`Đã tạo phòng ${newRoom.name}! Mã PIN: ${newRoom.pinCode}`);
    return newRoom;
  };

  const joinRoomByPin = async (pinCode: string) => {
    if (!currentUser) throw new Error('Vui lòng đăng nhập!');
    const room = await joinLogRoomByPinInFirestore(pinCode, currentUser);
    setCurrentRoom(room);
    showToast(`Đã vào phòng ${room.name}! 🎉`);
    return room;
  };

  const postClip = async (
    roomId: string,
    videoUri: string,
    hourSlot: string,
    caption: string,
    theme: string,
    onProgress?: (p: number) => void
  ) => {
    if (!currentUser) throw new Error('Vui lòng đăng nhập!');

    // 1. Upload video to Firebase Storage (REQ-05)
    const downloadUrl = await uploadClipMediaToStorage(roomId, videoUri, onProgress);

    // 2. Save clip document to Firestore (REQ-05, REQ-07)
    await saveClipToFirestore(roomId, {
      logId: roomId,
      memberId: currentUser.id,
      memberName: currentUser.displayName,
      memberAvatar: currentUser.avatarUrl,
      hourSlot,
      videoUrl: downloadUrl,
      caption,
      theme,
      createdAt: Date.now()
    });

    showToast('Đã đăng 2s Vlog thành công lên phòng! 🎬');
  };

  const addReaction = async (roomId: string, clipId: string, emoji: string) => {
    if (!currentUser) return;
    await addReactionToClipInFirestore(roomId, clipId, emoji, currentUser);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        authLoading,
        userRooms,
        currentRoom,
        currentRoomClips,
        toastMessage,
        showToast,
        setCurrentRoom,
        register,
        login,
        loginWithGoogle,
        logout,
        createRoom,
        joinRoomByPin,
        postClip,
        addReaction
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
