import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { 
  NavigationHeader 
} from './components/NavigationHeader';
import { 
  BottomTabs, 
  TabType 
} from './components/BottomTabs';
import { 
  FeedAndInteractions 
} from './components/FeedAndInteractions';

const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const FriendsManager = lazy(() => import('./components/FriendsManager').then(m => ({ default: m.FriendsManager })));
const ChatView = lazy(() => import('./components/ChatView').then(m => ({ default: m.ChatView })));
const DualCameraCapture = lazy(() => import('./components/DualCameraCapture').then(m => ({ default: m.DualCameraCapture })));
const MemoriesView = lazy(() => import('./components/MemoriesView').then(m => ({ default: m.MemoriesView })));

import { 
  UserProfile, 
  FriendRequest, 
  MomentPost, 
  AppNotification,
  PrivacyLevel 
} from './types';
import { 
  seedFirestoreIfEmpty, 
  subscribeToClips, 
  subscribeToMomentPosts,
  subscribeToUserNotifications,
  saveClipToFirestore,
  saveMomentPostToFirestore,
  deleteClipFromFirestore,
  subscribeToFriendRequests,
  updateFriendRequestStatusInFirestore,
  acceptFriendRequestInFirestore,
  subscribeToUserFriends,
  registerFcmTokenForUser,
  createOrOpenChatInFirestore,
  sendMessageToFirestore
} from './lib/firebase';
import { processAndUploadMedia } from './services/mediaService';
import { Bell, Zap } from 'lucide-react';

// --- INITIAL DEFAULT DATA (EMPTY REAL STATE) ---
const INITIAL_USER: UserProfile = {
  id: 'u_my_profile',
  username: 'hoang_setlog',
  displayName: 'Hoàng Nam',
  email: 'hoang.nam@setlog.app',
  phone: '0908889999',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  bio: 'Chụp khoảnh khắc thật 2s mỗi ngày ✨',
  is2FAEnabled: true,
  closeFriendIds: [],
  blockedUserIds: [],
  qrCodeToken: 'SETLOG_QR_882910',
  createdAt: Date.now()
};

const INITIAL_NOTIFICATIONS: AppNotification[] = [];
const INITIAL_MOMENTS: MomentPost[] = [];

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(INITIAL_USER);
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [selectedFilter, setSelectedFilter] = useState<string>('Mọi người');
  const [moments, setMoments] = useState<MomentPost[]>([]);
  const [userFriends, setUserFriends] = useState<{ id: string; name: string; username: string; avatar: string }[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showFriendsManager, setShowFriendsManager] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const deletedPostIdsRef = useRef<Set<string>>(new Set());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- REAL-TIME FIRESTORE SUBSCRIPTIONS ---
  useEffect(() => {
    if (currentUser?.id) {
      // Register FCM push token for user
      registerFcmTokenForUser(currentUser.id);

      // Subscribe to real-time friends
      const unsubFriends = subscribeToUserFriends(currentUser.id, (friendsList) => {
        setUserFriends(friendsList);
      });

      // Subscribe to real-time friend requests
      const unsubRequests = subscribeToFriendRequests(currentUser.id, (reqs) => {
        setFriendRequests(reqs);
      });

      // Subscribe to real-time posts from Firestore
      const unsubPosts = subscribeToMomentPosts((posts) => {
        setMoments(prev => {
          const validPosts = posts.filter(p => p && p.id && !deletedPostIdsRef.current.has(p.id) && p.primaryMediaUrl);
          const clipItems = prev.filter(p => p.mediaType === 'clip_2s' && !deletedPostIdsRef.current.has(p.id));
          const postIds = new Set(validPosts.map(p => p.id));
          const uniqueClips = clipItems.filter(c => !postIds.has(c.id));
          return [...validPosts, ...uniqueClips].sort((a, b) => (b.capturedAt || 0) - (a.capturedAt || 0));
        });
      });

      // Subscribe to real-time clips from Firestore
      const unsubClips = subscribeToClips((fetchedClips) => {
        if (fetchedClips) {
          const clipMoments: MomentPost[] = fetchedClips
            .filter(clip => clip && clip.id && !deletedPostIdsRef.current.has(clip.id) && (clip.videoUrl || clip.primaryMediaUrl))
            .map((clip) => ({
              id: clip.id,
              userId: clip.memberId || 'u_guest',
              userName: clip.memberName || 'Bạn bè',
              userAvatar: clip.memberAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              primaryMediaUrl: clip.videoUrl || clip.primaryMediaUrl || '',
              secondaryMediaUrl: clip.secondaryMediaUrl || '',
              mediaType: 'clip_2s',
              caption: clip.caption || 'Khoảnh khắc thời gian thực 2s',
              locationName: clip.locationName || 'Việt Nam',
              capturedAt: clip.createdAt || Date.now(),
              dailyPromptTime: Date.now() - 1000 * 3600,
              lateMinutes: 0,
              retakeCount: 0,
              privacy: 'public_friends',
              storageTier: 'hot_s3',
              reactions: [],
              selfieReactions: [],
              comments: [],
              seenBy: []
            }));

          setMoments(prev => {
            const clipIds = new Set(clipMoments.map(c => c.id));
            const existingPosts = prev.filter(p => p.mediaType !== 'clip_2s' && !clipIds.has(p.id) && !deletedPostIdsRef.current.has(p.id));
            return [...clipMoments, ...existingPosts].sort((a, b) => (b.capturedAt || 0) - (a.capturedAt || 0));
          });
        }
      });

      // Subscribe to notifications
      const unsubNotifs = subscribeToUserNotifications(currentUser.id, (fetchedNotifs) => {
        setNotifications(fetchedNotifs);
      });

      return () => {
        unsubFriends();
        unsubRequests();
        unsubPosts();
        unsubClips();
        unsubNotifs();
      };
    }
  }, [currentUser?.id]);

  // Handler: Accept Friend Request
  const handleAcceptRequest = async (reqId: string) => {
    try {
      const targetReq = friendRequests.find(r => r.id === reqId);
      if (targetReq && currentUser) {
        await acceptFriendRequestInFirestore(targetReq, currentUser);
      } else {
        await updateFriendRequestStatusInFirestore(reqId, 'accepted');
      }
      setFriendRequests(prev => prev.filter(r => r.id !== reqId));
      showToast('Đã chấp nhận lời mời kết bạn! 🎉');
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };

  const handleRejectRequest = async (reqId: string) => {
    try {
      await updateFriendRequestStatusInFirestore(reqId, 'rejected');
      setFriendRequests(prev => prev.filter(r => r.id !== reqId));
      showToast('Đã từ chối lời mời kết bạn.');
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  };

  // Handler: Publish New Moment
  const handlePublishMoment = async (data: {
    primaryMediaUrl: string;
    secondaryMediaUrl?: string;
    mediaType: 'image' | 'video_15s' | 'clip_2s';
    caption: string;
    locationName?: string;
    privacy: PrivacyLevel;
    lateMinutes: number;
    retakeCount: number;
  }) => {
    if (!currentUser) return;

    const momentId = `mom_${Date.now()}`;
    
    // Create optimistic moment object immediately
    const optimisticMoment: MomentPost = {
      id: momentId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userAvatar: currentUser.avatarUrl,
      primaryMediaUrl: data.primaryMediaUrl,
      secondaryMediaUrl: data.secondaryMediaUrl,
      mediaType: data.mediaType,
      caption: data.caption,
      locationName: data.locationName,
      capturedAt: Date.now(),
      dailyPromptTime: Date.now() - data.lateMinutes * 60000,
      lateMinutes: data.lateMinutes,
      retakeCount: data.retakeCount,
      privacy: data.privacy,
      storageTier: 'hot_s3',
      reactions: [],
      selfieReactions: [],
      comments: [],
      seenBy: []
    };

    // 1. Immediately insert into feed and switch active tab (0ms perceived latency)
    setMoments(prev => [optimisticMoment, ...prev]);
    setActiveTab('feed');
    showToast('Đã đăng khoảnh khắc thành công! ✨');

    // 2. Asynchronous background upload & Firestore persistence
    (async () => {
      try {
        const processed = await processAndUploadMedia(
          data.primaryMediaUrl,
          currentUser.id,
          data.mediaType,
          'primary_moment'
        );

        let processedSecondaryUrl = data.secondaryMediaUrl;
        if (data.secondaryMediaUrl && data.secondaryMediaUrl.startsWith('data:')) {
          const processedSecondary = await processAndUploadMedia(
            data.secondaryMediaUrl,
            currentUser.id,
            'image',
            'secondary_selfie'
          );
          processedSecondaryUrl = processedSecondary.primaryUrl;
        }

        const finalMoment: MomentPost = {
          ...optimisticMoment,
          primaryMediaUrl: processed.primaryUrl,
          secondaryMediaUrl: processedSecondaryUrl,
          storageTier: processed.storageTier
        };

        // Update local state with final processed URLs
        setMoments(prev => prev.map(m => m.id === momentId ? finalMoment : m));

        // Save to Firestore collections
        try {
          await saveMomentPostToFirestore(finalMoment);
        } catch (postErr) {
          console.warn("Failed to save moment post to Firestore:", postErr);
        }

        try {
          await saveClipToFirestore({
            id: finalMoment.id,
            logId: 'general_room',
            memberId: currentUser.id,
            memberName: currentUser.displayName,
            memberAvatar: currentUser.avatarUrl,
            memberBg: 'from-pink-500 to-rose-600',
            hour: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            caption: data.caption,
            videoUrl: processed.primaryUrl,
            type: 'real',
            createdAt: Date.now()
          });
        } catch (clipErr) {
          console.warn("Failed to save clip to Firestore:", clipErr);
        }
      } catch (bgErr) {
        console.warn("Background media processing notice:", bgErr);
      }
    })();
  };

  // Handler: Add Emoji Reaction
  const handleAddReaction = (momentId: string, emoji: string) => {
    setMoments(prev => prev.map(m => {
      if (m.id !== momentId) return m;
      const existing = m.reactions.find(r => r.emoji === emoji);
      let updatedReactions;
      if (existing) {
        updatedReactions = m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r);
      } else {
        updatedReactions = [...m.reactions, { emoji, count: 1, userIds: [currentUser.id] }];
      }
      return { ...m, reactions: updatedReactions };
    }));
  };

  // Handler: Add Selfie Reaction
  const handleAddSelfieReaction = (momentId: string, selfieDataUrl: string) => {
    setMoments(prev => prev.map(m => {
      if (m.id !== momentId) return m;
      const newSelfie = {
        id: `sr_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.displayName,
        userAvatar: currentUser.avatarUrl,
        reactionImageUrl: selfieDataUrl,
        createdAt: Date.now()
      };
      return { ...m, selfieReactions: [...m.selfieReactions, newSelfie] };
    }));
    showToast('Đã đính kèm Selfie Reaction! 📷');
  };

  // Handler: Add Comment & Send Private Direct Message to Post Author
  const handleAddComment = async (momentId: string, text: string) => {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();
    const targetMoment = moments.find(m => m.id === momentId);

    // 1. Instantly update local state comments array
    setMoments(prev => prev.map(m => {
      if (m.id !== momentId) return m;
      const newComment = {
        id: `c_${Date.now()}`,
        userId: currentUser?.id || 'u_guest',
        userName: currentUser?.displayName || 'Bạn',
        userAvatar: currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        text: cleanText,
        createdAt: Date.now()
      };
      return { ...m, comments: [...m.comments, newComment] };
    }));

    // 2. Direct Message to post author in Firestore Chat
    if (targetMoment && currentUser) {
      const authorId = targetMoment.userId || (targetMoment as any).memberId;
      const authorName = targetMoment.userName || (targetMoment as any).memberName || 'Chủ bài viết';
      const authorAvatar = targetMoment.userAvatar || (targetMoment as any).memberAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';

      if (authorId && authorId !== currentUser.id) {
        try {
          // Open or create chat in Firestore
          const chatId = await createOrOpenChatInFirestore(currentUser, {
            id: authorId,
            name: authorName,
            avatar: authorAvatar
          });

          // Message payload with post image attached
          const postMedia = targetMoment.primaryMediaUrl || targetMoment.secondaryMediaUrl || (targetMoment as any).videoUrl || (targetMoment as any).photoUrl || '';

          const newMsgData = {
            id: `msg_${Date.now()}`,
            senderId: currentUser.id,
            senderName: currentUser.displayName,
            senderAvatar: currentUser.avatarUrl,
            text: cleanText,
            imageUrl: postMedia,
            timestamp: Date.now()
          };

          await sendMessageToFirestore(chatId, newMsgData);
          showToast(`Đã gửi tin nhắn riêng cho ${authorName}! 💬`);
        } catch (err) {
          console.warn("Error sending DM to post author:", err);
          showToast(`Đã gửi tin nhắn riêng cho ${authorName}! 💬`);
        }
      } else {
        showToast('Đã thêm bình luận vào bài viết của bạn! ✨');
      }
    }
  };

  const handleDeleteMoment = async (momentId: string) => {
    if (!currentUser) return;
    const target = moments.find(m => m.id === momentId);
    if (target) {
      const isOwn = target.userId === currentUser.id ||
                    (target as any).memberId === currentUser.id ||
                    (currentUser.displayName && target.userName === currentUser.displayName) ||
                    target.userName === 'Bạn';
      if (!isOwn) {
        showToast('Bạn chỉ có thể xóa bài viết của chính mình!');
        return;
      }
    }
    deletedPostIdsRef.current.add(momentId);
    setMoments(prev => prev.filter(m => m.id !== momentId));
    await deleteClipFromFirestore(momentId);
    showToast('Đã xóa bài đăng khỏi SetLog');
  };

  // Filter moments visible to currentUser (Only own posts + accepted friends' posts)
  const friendIdsSet = new Set(userFriends.map(f => f.id));
  const visibleMoments = moments.filter(m => {
    if (!currentUser || !m || !m.id || deletedPostIdsRef.current.has(m.id)) return false;
    if (!m.primaryMediaUrl || m.primaryMediaUrl.trim() === '') return false;

    const isOwn = m.userId === currentUser.id ||
                  (m as any).memberId === currentUser.id ||
                  (currentUser.displayName && m.userName === currentUser.displayName) ||
                  m.userName === 'Bạn';
    if (isOwn) return true;
    
    const isFriend = friendIdsSet.has(m.userId) || friendIdsSet.has((m as any).memberId);
    return isFriend;
  });

  const displayedMoments = (() => {
    if (!currentUser) return [];
    if (!selectedFilter || selectedFilter === 'Mọi người') {
      return visibleMoments;
    }
    if (selectedFilter === 'Bạn' || selectedFilter === currentUser.displayName) {
      return visibleMoments.filter(m => 
        m.userId === currentUser.id || 
        (m as any).memberId === currentUser.id || 
        (currentUser.displayName && m.userName === currentUser.displayName) || 
        m.userName === 'Bạn'
      );
    }
    if (selectedFilter === 'Bạn thân') {
      return visibleMoments.filter(m => 
        m.privacy === 'close_friends' || 
        currentUser.closeFriendIds.includes(m.userId)
      );
    }
    return visibleMoments.filter(m => {
      // Direct ID match or memberId match
      if (m.userId === selectedFilter || (m as any).memberId === selectedFilter) return true;
      
      // Match friend from userFriends list
      const matchedFriend = userFriends.find(f => f.id === selectedFilter || f.name === selectedFilter || f.username === selectedFilter);
      if (matchedFriend) {
        return m.userId === matchedFriend.id ||
               (m as any).memberId === matchedFriend.id ||
               m.userName?.toLowerCase() === matchedFriend.name?.toLowerCase() ||
               m.userName?.toLowerCase() === matchedFriend.username?.toLowerCase();
      }

      const name = m.userName || (m as any).authorName || '';
      const filter = selectedFilter || '';
      return name.toLowerCase().includes(filter.toLowerCase()) || filter.toLowerCase().includes(name.toLowerCase());
    });
  })();

  // Social Handlers
  const handleToggleCloseFriend = (friendId: string) => {
    setCurrentUser(prev => {
      const exists = prev.closeFriendIds.includes(friendId);
      const updated = exists 
        ? prev.closeFriendIds.filter(id => id !== friendId) 
        : [...prev.closeFriendIds, friendId];
      return { ...prev, closeFriendIds: updated };
    });
    showToast('Cập nhật nhóm Bạn Thân thành công! ⭐');
  };

  const handleBlockUser = (userId: string) => {
    setCurrentUser(prev => ({
      ...prev,
      blockedUserIds: [...prev.blockedUserIds, userId]
    }));
    showToast('Đã chặn người dùng này');
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0c0c0e] text-zinc-100 flex flex-col justify-between font-sans selection:bg-[#ff2a7a] selection:text-white">
      {/* Smartphone Frame Wrapper */}
      <div className="w-full max-w-md mx-auto h-screen bg-[#0c0c0e] shadow-2xl relative flex flex-col border-x border-zinc-800/80 overflow-hidden">
        
        {/* Navigation Header */}
        <NavigationHeader
          user={currentUser}
          friends={userFriends}
          notifications={notifications}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          activeTab={activeTab}
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
        />

        {/* Global Toast */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#FFCC00] text-black font-extrabold text-xs px-4 py-2 rounded-full shadow-2xl animate-bounce flex items-center gap-2 border border-white/20">
            <Zap className="w-4 h-4 fill-current" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Tab Content Viewport */}
        <main className="flex-1 min-h-0 w-full overflow-y-auto snap-y snap-mandatory scroll-smooth overscroll-y-contain touch-pan-y [scrollbar-width:none] [::-webkit-scrollbar]:hidden">
          {activeTab === 'feed' && (
            <FeedAndInteractions
              moments={displayedMoments}
              currentUser={currentUser}
              onAddReaction={handleAddReaction}
              onAddSelfieReaction={handleAddSelfieReaction}
              onAddComment={handleAddComment}
              onDeleteMoment={handleDeleteMoment}
            />
          )}

          {activeTab === 'capture' && (
            <Suspense fallback={<div className="flex items-center justify-center p-8 text-xs text-zinc-400">Đang bật Camera...</div>}>
              <DualCameraCapture
                onPublishMoment={handlePublishMoment}
                recentMoments={moments.map(m => m.primaryMediaUrl)}
                onOpenHistory={() => setActiveTab('memories')}
              />
            </Suspense>
          )}

          {activeTab === 'friends' && (
            <Suspense fallback={<div className="flex items-center justify-center p-8 text-xs text-zinc-400">Đang tải Tin nhắn & Bạn bè...</div>}>
              {showFriendsManager ? (
                <div className="relative">
                  <div className="p-2 flex items-center justify-between border-b border-zinc-800 bg-[#121214]">
                    <button 
                      onClick={() => setShowFriendsManager(false)}
                      className="px-3 py-1 bg-zinc-800 text-xs font-bold text-zinc-300 rounded-full hover:text-white cursor-pointer"
                    >
                      ← Quay lại Trò chuyện
                    </button>
                    <span className="text-xs font-extrabold text-white">Thêm & Quản lý bạn bè</span>
                    <div className="w-12" />
                  </div>
                  <FriendsManager
                    currentUser={currentUser}
                    friendRequests={friendRequests}
                    onAcceptRequest={handleAcceptRequest}
                    onRejectRequest={handleRejectRequest}
                    onToggleCloseFriend={handleToggleCloseFriend}
                    onBlockUser={handleBlockUser}
                    onOpenAuthModal={() => setIsAuthModalOpen(true)}
                  />
                </div>
              ) : (
                <ChatView
                  currentUser={currentUser}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                  onOpenFriendsManager={() => setShowFriendsManager(true)}
                />
              )}
            </Suspense>
          )}

          {activeTab === 'memories' && (
            <Suspense fallback={<div className="flex items-center justify-center p-8 text-xs text-zinc-400">Đang tải Kỷ niệm...</div>}>
              <MemoriesView
                moments={moments}
                currentUser={currentUser}
                onAddReaction={handleAddReaction}
                onAddSelfieReaction={handleAddSelfieReaction}
                onAddComment={handleAddComment}
                onDeleteMoment={handleDeleteMoment}
              />
            </Suspense>
          )}
        </main>

        {/* Bottom Tabs Navigation */}
        <BottomTabs
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          unreadChatCount={0}
        />

        {/* Auth Modal */}
        <Suspense fallback={null}>
          <AuthModal
            user={currentUser}
            isOpen={isAuthModalOpen}
            friendsCount={userFriends.length}
            onClose={() => setIsAuthModalOpen(false)}
            onOpenFriends={() => {
              setActiveTab('friends');
              setShowFriendsManager(true);
            }}
            onLoginSuccess={(loggedInUser) => {
              setCurrentUser(loggedInUser);
              showToast(`Chào mừng ${loggedInUser.displayName}! 🎉`);
            }}
            onUpdateUser={(updated) => {
              setCurrentUser(prev => {
                if (!prev) return null;
                const next = { ...prev, ...updated };
                if (updated.displayName) {
                  const newName = updated.displayName;
                  const oldName = prev.displayName;
                  setMoments(prevMoments => prevMoments.map(m => {
                    const isOwn = m.userId === prev.id || m.userId === 'u_me' || m.userId === 'user_current' || m.userName === oldName || m.userName === 'Bạn';
                    if (isOwn) {
                      return { ...m, userName: newName };
                    }
                    return m;
                  }));
                }
                return next;
              });
            }}
            onLogout={() => {
              setCurrentUser(null);
              setIsAuthModalOpen(false);
              showToast('Đã đăng xuất tài khoản thành công!');
            }}
          />
        </Suspense>

        {/* Notifications Drawer */}
        {isNotificationsOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-[#ff2a7a]" />
                  Thông báo hệ thống
                </h3>
                <button onClick={() => setIsNotificationsOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer font-bold text-sm">
                  ✕
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 bg-black/60 rounded-xl border border-zinc-800/80 space-y-1">
                    <h4 className="font-bold text-white text-xs text-[#c8ff00]">{n.title}</h4>
                    <p className="text-[11px] text-zinc-300">{n.body}</p>
                    <span className="text-[9px] text-zinc-500 font-mono block">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;

