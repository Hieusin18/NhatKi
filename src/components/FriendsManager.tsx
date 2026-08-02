import React, { useState, useEffect } from 'react';
import { Search, Users, X, RotateCcw, Link2, MessageCircle, Instagram, Share2, ChevronDown, Check, UserPlus } from 'lucide-react';
import { UserProfile, FriendRequest } from '../types';
import { searchUsersInFirestore, sendFriendRequestToFirestore, subscribeToUserFriends, removeFriendFromFirestore } from '../lib/firebase';

interface FriendsManagerProps {
  currentUser: UserProfile | null;
  friendRequests: FriendRequest[];
  onAcceptRequest: (reqId: string) => void;
  onRejectRequest: (reqId: string) => void;
  onToggleCloseFriend: (friendId: string) => void;
  onBlockUser: (userId: string) => void;
  onOpenAuthModal?: () => void;
}

export const FriendsManager: React.FC<FriendsManagerProps> = ({
  currentUser,
  friendRequests,
  onAcceptRequest,
  onRejectRequest,
  onToggleCloseFriend,
  onBlockUser,
  onOpenAuthModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllFriends, setShowAllFriends] = useState(false);
  const [friendsList, setFriendsList] = useState<{ id: string; name: string; username: string; avatar: string }[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<{ id: string; name: string; avatar: string }[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Subscribe to real friends list from Firestore
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = subscribeToUserFriends(currentUser.id, (list) => {
      setFriendsList(list);
    });
    return () => unsub();
  }, [currentUser?.id]);

  // Search real users in Firestore when typing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await searchUsersInFirestore(searchQuery);
        // Exclude current user
        setSearchResults(users.filter(u => u.id !== currentUser?.id));
      } catch (err) {
        console.warn("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser?.id]);

  const handleSendRequest = async (targetUser: UserProfile) => {
    if (!currentUser) return;
    const newReq: FriendRequest = {
      id: `fr_${Date.now()}_${targetUser.id}`,
      fromUserId: currentUser.id,
      fromUserName: currentUser.displayName,
      fromUserAvatar: currentUser.avatarUrl,
      toUserId: targetUser.id,
      status: 'pending',
      timestamp: Date.now()
    };

    try {
      await sendFriendRequestToFirestore(newReq);
      setSentRequests(prev => [...prev, { id: newReq.id, name: targetUser.displayName, avatar: targetUser.avatarUrl }]);
      setStatusMessage(`Đã gửi lời mời kết bạn tới ${targetUser.displayName}!`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error("Send request failed:", err);
    }
  };

  const handleRemoveFriend = async (id: string) => {
    setFriendsList(prev => prev.filter(f => f.id !== id));
    if (currentUser?.id) {
      await removeFriendFromFirestore(currentUser.id, id);
    }
  };

  const handleCancelSent = (id: string) => {
    setSentRequests(prev => prev.filter(r => r.id !== id));
  };

  const visibleFriends = showAllFriends ? friendsList : friendsList.slice(0, 3);

  return (
    <div className="p-4 max-w-md mx-auto space-y-6 pb-28 text-white">
      {/* Drag handle line */}
      <div className="w-10 h-1 bg-zinc-700/80 rounded-full mx-auto -mt-1" />

      {/* Header Stat & Title */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          {friendsList.length} / 20 người bạn
        </h2>
        <p className="text-xs text-zinc-400 font-medium">
          Mời bạn bè để cùng chia sẻ khoảnh khắc 2s SetLog
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-[#c8ff00]/10 border border-[#c8ff00]/30 text-[#c8ff00] text-xs font-bold rounded-2xl text-center">
          {statusMessage}
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative">
        <div className="flex items-center gap-2.5 bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl px-4 py-3 shadow-inner">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo tên, username hoặc SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-500 font-medium"
          />
        </div>
      </div>

      {/* Search Results from Firestore */}
      {searchQuery.trim().length > 0 && (
        <div className="space-y-3 pt-1">
          <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <Search className="w-4 h-4 text-zinc-400" />
            <span>Kết quả tìm kiếm thực tế</span>
          </h3>

          {isSearching ? (
            <div className="p-4 text-center text-xs text-zinc-500">Đang tìm kiếm...</div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800">
              Không tìm thấy người dùng nào với từ khóa này.
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-2 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <img src={u.avatarUrl} alt={u.displayName} className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
                    <div>
                      <div className="font-extrabold text-xs text-white">{u.displayName}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">@{u.username}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendRequest(u)}
                    className="px-3 py-1.5 bg-[#FFCC00] text-black font-extrabold text-xs rounded-xl hover:bg-amber-400 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Thêm bạn</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Find Friends From Other Apps */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span>Chia sẻ liên kết mời bạn</span>
        </h3>

        <div className="grid grid-cols-4 gap-3 text-center">
          <button
            onClick={() => alert("Mở Messenger để mời bạn bè!")}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-13 h-13 rounded-full bg-[#0084FF] flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-transform">
              <MessageCircle className="w-6 h-6 fill-current stroke-none" />
            </div>
            <span className="text-[11px] font-medium text-zinc-300">Messenger</span>
          </button>

          <button
            onClick={() => alert("Mở Instagram để mời bạn bè!")}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-transform">
              <Instagram className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-zinc-300">Insta</span>
          </button>

          <button
            onClick={() => alert("Mở Tin nhắn SMS để gửi lời mời!")}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-13 h-13 rounded-full bg-[#34C759] flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-transform">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-zinc-300">Tin nhắn</span>
          </button>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'SetLog', text: 'Kết bạn SetLog với tôi nhé!', url: window.location.href });
              } else {
                alert("Đã sao chép liên kết kết bạn SetLog!");
              }
            }}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-13 h-13 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-200 shadow-lg group-active:scale-90 transition-transform">
              <Link2 className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-zinc-300">Khác</span>
          </button>
        </div>
      </div>

      {/* Section: Incoming Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#FFCC00]" />
            <span>Lời mời kết bạn ({friendRequests.length})</span>
          </h3>

          <div className="space-y-2">
            {friendRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <img src={req.fromUserAvatar} alt={req.fromUserName} className="w-10 h-10 rounded-full object-cover border border-[#FFCC00]" />
                  <span className="font-extrabold text-xs text-white">{req.fromUserName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAcceptRequest(req.id)}
                    className="px-3 py-1.5 bg-[#34C759] text-black font-extrabold text-xs rounded-xl hover:bg-green-400 cursor-pointer active:scale-95"
                  >
                    Chấp nhận
                  </button>
                  <button
                    onClick={() => onRejectRequest(req.id)}
                    className="px-3 py-1.5 bg-zinc-800 text-zinc-300 font-extrabold text-xs rounded-xl hover:bg-zinc-700 cursor-pointer active:scale-95"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Bạn bè của bạn */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
          <Users className="w-4 h-4 text-zinc-400" />
          <span>Bạn bè của bạn</span>
        </h3>

        {friendsList.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl space-y-1">
            <p className="font-bold text-zinc-400">Chưa có bạn bè nào</p>
            <p>Sử dụng thanh tìm kiếm phía trên để kết bạn với người dùng thật!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleFriends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-1">
                <div 
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="relative w-12 h-12 rounded-full p-0.5 border-2 border-[#FFCC00] overflow-hidden shrink-0 group-hover:scale-105 transition-transform shadow-md">
                    <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover rounded-full" />
                  </div>
                  <span className="font-extrabold text-white text-sm tracking-tight">{friend.name}</span>
                </div>

                <button
                  onClick={() => handleRemoveFriend(friend.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                  title="Hủy kết bạn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {!showAllFriends && friendsList.length > 3 && !searchQuery && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setShowAllFriends(true)}
                  className="px-5 py-2 bg-[#2c2c2e] hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-full transition-all cursor-pointer shadow-md active:scale-95"
                >
                  Xem thêm
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section: Đã gửi yêu cầu */}
      {sentRequests.length > 0 && (
        <div className="space-y-3 pt-3">
          <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-zinc-400" />
            <span>Đã gửi yêu cầu</span>
          </h3>

          <div className="space-y-2.5">
            {sentRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-700 shrink-0 shadow-md">
                    <img src={req.avatar} alt={req.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-extrabold text-white text-sm tracking-tight">{req.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCancelSent(req.id)}
                    className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    title="Hủy yêu cầu"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

