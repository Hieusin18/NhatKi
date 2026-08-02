import React, { useState, useEffect } from 'react';
import { ChevronRight, Pencil, ArrowLeft, Send, Camera, Image, Smile, Users, UserPlus, Search, MessageSquare, X, Volume2, ChevronDown, Check, CheckCheck } from 'lucide-react';
import { UserProfile } from '../types';
import { subscribeToUserChats, subscribeToChatMessages, sendMessageToFirestore, subscribeToUserFriends, createOrOpenChatInFirestore, markMessagesAsReadInFirestore } from '../lib/firebase';

interface MessageItem {
  id: string;
  sender: 'me' | 'them';
  text?: string;
  imageUrl?: string;
  timestamp: string;
  read?: boolean;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  hasUnread?: boolean;
  messages: MessageItem[];
}

interface ChatViewProps {
  currentUser: UserProfile | null;
  onOpenAuthModal?: () => void;
  onOpenFriendsManager?: () => void;
}

const ChatMessageMedia: React.FC<{ imageUrl: string; onClick?: () => void }> = ({ imageUrl, onClick }) => {
  const [hasError, setHasError] = useState(false);

  const isVideo = imageUrl.startsWith('data:video') || 
                  imageUrl.includes('.mp4') || 
                  imageUrl.includes('.webm') || 
                  imageUrl.includes('.mov') ||
                  hasError;

  return (
    <div 
      onClick={onClick}
      className="w-48 aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-700/80 shadow-xl mb-1.5 cursor-pointer hover:opacity-90 active:scale-98 transition-all relative group bg-black"
    >
      {isVideo ? (
        <video 
          src={imageUrl} 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover" 
        />
      ) : (
        <img 
          src={imageUrl} 
          alt="Bài viết SetLog" 
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      )}
      <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-[#FFCC00] border border-white/10 flex items-center gap-1 shadow-md">
        <span>SetLog</span>
      </div>
    </div>
  );
};

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  onOpenAuthModal,
  onOpenFriendsManager
}) => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatMessages, setChatMessages] = useState<MessageItem[]>([]);
  const [isFriendSelectorOpen, setIsFriendSelectorOpen] = useState(false);
  const [realFriends, setRealFriends] = useState<{ id: string; name: string; username: string; avatar: string }[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Subscribe to real friends list
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = subscribeToUserFriends(currentUser.id, (friends) => {
      setRealFriends(friends);
    });
    return () => unsub();
  }, [currentUser?.id]);

  // Subscribe to real user chats from Firestore
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubChats = subscribeToUserChats(currentUser.id, (fetchedChats) => {
      const formatted: Conversation[] = fetchedChats.map((c) => {
        const otherParticipantId = c.participants?.find((p: string) => p !== currentUser.id) || 'guest';
        const otherName = c.participantNames?.[otherParticipantId] || 'Bạn bè';
        const otherAvatar = c.participantAvatars?.[otherParticipantId] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
        return {
          id: c.id,
          name: otherName,
          avatar: otherAvatar,
          lastMessage: c.lastMessage || 'Bắt đầu trò chuyện',
          timestamp: c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Mới',
          hasUnread: false,
          messages: []
        };
      });
      setConversations(formatted);
    });

    return () => {
      unsubChats();
    };
  }, [currentUser?.id]);

  // Subscribe to selected chat messages
  useEffect(() => {
    if (!selectedConversation) return;

    const unsubMsgs = subscribeToChatMessages(selectedConversation.id, (fetchedMsgs) => {
      const msgs: MessageItem[] = fetchedMsgs.map((m) => ({
        id: m.id,
        sender: m.senderId === currentUser?.id ? 'me' : 'them',
        text: m.text,
        imageUrl: m.imageUrl,
        timestamp: new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: !!m.read
      }));
      setChatMessages(msgs);

      if (currentUser?.id && selectedConversation?.id) {
        const hasUnreadFromThem = fetchedMsgs.some(m => m.senderId !== currentUser.id && !m.read);
        if (hasUnreadFromThem) {
          markMessagesAsReadInFirestore(selectedConversation.id, currentUser.id);
        }
      }
    });

    return () => {
      unsubMsgs();
    };
  }, [selectedConversation?.id, currentUser?.id]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedConversation || !currentUser) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');

    const newMsgData = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatarUrl,
      text: textToSend,
      read: false,
      timestamp: Date.now()
    };

    await sendMessageToFirestore(selectedConversation.id, newMsgData);
  };

  const filteredConversations = searchQuery.trim()
    ? conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  // Render detail thread if a conversation is selected
  if (selectedConversation) {
    return (
      <div className="flex flex-col h-full bg-[#0c0c0e] text-white">
        {/* Chat Thread Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-[#121214]">
          <button
            onClick={() => setSelectedConversation(null)}
            className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <img
              src={selectedConversation.avatar}
              alt={selectedConversation.name}
              className="w-8 h-8 rounded-full object-cover border border-[#FFCC00]"
            />
            <span className="font-extrabold text-sm text-white tracking-tight">
              {selectedConversation.name}
            </span>
          </div>

        <div className="w-9 h-9" />
      </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {chatMessages.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Chưa có tin nhắn nào. Gửi tin nhắn đầu tiên!
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
              >
                {msg.imageUrl && (
                  <ChatMessageMedia 
                    imageUrl={msg.imageUrl} 
                    onClick={() => setPreviewImageUrl(msg.imageUrl || null)} 
                  />
                )}
                {msg.text && (
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-md ${
                      msg.sender === 'me'
                        ? 'bg-[#FFCC00] text-black rounded-tr-xs'
                        : 'bg-[#2c2c2e] text-white rounded-tl-xs border border-zinc-700/60'
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] font-medium">
                  <span className="text-zinc-500 font-mono">{msg.timestamp}</span>
                  {msg.sender === 'me' && (
                    <>
                      <span className="text-zinc-600">•</span>
                      {msg.read ? (
                        <span className="text-[#FFCC00] flex items-center gap-0.5 font-bold">
                          <CheckCheck className="w-3 h-3 text-[#FFCC00]" />
                          Đã xem
                        </span>
                      ) : (
                        <span className="text-zinc-400 flex items-center gap-0.5 font-semibold">
                          <Check className="w-3 h-3 text-zinc-400" />
                          Đã gửi
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input Footer */}
        <div className="p-3 bg-[#121214] border-t border-zinc-800/80 flex items-center gap-2 pb-24">
          <button className="p-2 text-zinc-400 hover:text-white cursor-pointer">
            <Camera className="w-5 h-5 text-[#FFCC00]" />
          </button>
          <div className="flex-1 bg-[#1c1c1e] border border-zinc-800 rounded-full px-4 py-2 flex items-center gap-2">
            <input
              type="text"
              placeholder="Gửi tin nhắn..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-500 font-medium"
            />
            <button className="text-zinc-400 hover:text-white">
              <Smile className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            className="w-9 h-9 rounded-full bg-[#FFCC00] text-black flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer"
          >
            <Send className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Fullscreen Media Preview Modal */}
        {previewImageUrl && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setPreviewImageUrl(null)}
          >
            <div className="relative max-w-sm w-full max-h-[80vh] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-black" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setPreviewImageUrl(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              {previewImageUrl.startsWith('data:video') || previewImageUrl.includes('.mp4') || previewImageUrl.includes('.webm') ? (
                <video src={previewImageUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
              ) : (
                <img src={previewImageUrl} alt="Preview" className="w-full h-full object-contain" />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleSelectFriendForChat = async (friend: { id: string; name: string; avatar: string }) => {
    if (!currentUser) return;
    try {
      const chatId = await createOrOpenChatInFirestore(currentUser, friend);
      setSelectedConversation({
        id: chatId,
        name: friend.name,
        avatar: friend.avatar,
        lastMessage: 'Bắt đầu trò chuyện',
        timestamp: 'Vừa xong',
        messages: []
      });
      setIsFriendSelectorOpen(false);
    } catch (err) {
      console.error("Error creating chat:", err);
    }
  };

  return (
    <div className="relative min-h-full flex flex-col bg-[#0c0c0e] text-white pb-28">
      {/* Friend Selector Modal */}
      {isFriendSelectorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-zinc-800 rounded-3xl w-full max-w-sm p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FFCC00]" />
                <span>Chọn bạn bè để trò chuyện</span>
              </h3>
              <button
                onClick={() => setIsFriendSelectorOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {realFriends.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 space-y-3">
                <p>Bạn chưa có bạn bè nào.</p>
                {onOpenFriendsManager && (
                  <button
                    onClick={() => {
                      setIsFriendSelectorOpen(false);
                      onOpenFriendsManager();
                    }}
                    className="px-4 py-2 bg-[#FFCC00] text-black font-extrabold text-xs rounded-xl hover:bg-amber-400 cursor-pointer"
                  >
                    Tìm & Thêm bạn ngay
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {realFriends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => handleSelectFriendForChat(friend)}
                    className="flex items-center gap-3 p-2.5 bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-2xl cursor-pointer transition-all active:scale-98"
                  >
                    <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full object-cover border border-[#FFCC00]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-xs text-white truncate">{friend.name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">@{friend.username}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-[#0c0c0e]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-zinc-900">
        <div className="w-8 h-8" />

        <h1 className="text-lg font-extrabold text-white tracking-tight">
          Trò chuyện
        </h1>

        <div className="w-8 h-8" />
      </div>

      {/* Sub header search or quick tabs */}
      <div className="px-4 py-2 flex items-center justify-between gap-2">
        <div className="flex-1 flex items-center gap-2 bg-[#1c1c1e] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-white placeholder:text-zinc-500 font-medium text-xs"
          />
        </div>

        {onOpenFriendsManager && (
          <button
            onClick={onOpenFriendsManager}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            title="Thêm & Quản lý bạn bè"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Conversations List / Empty State */}
      <div className="flex-1 divide-y divide-zinc-900/60 px-2">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#FFCC00]">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white">Chưa có trò chuyện nào</h3>
              <p className="text-xs text-zinc-400 max-w-xs">
                Kết bạn để bắt đầu trò chuyện và chia sẻ khoảnh khắc SetLog với bạn bè!
              </p>
            </div>
            {onOpenFriendsManager && (
              <button
                onClick={onOpenFriendsManager}
                className="px-5 py-2.5 bg-[#FFCC00] text-black font-extrabold text-xs rounded-2xl hover:bg-amber-400 transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tìm & Thêm bạn bè</span>
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedConversation(chat)}
              className="flex items-center justify-between px-3 py-3.5 hover:bg-zinc-900/50 rounded-2xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative shrink-0">
                  <div className={`w-13 h-13 rounded-full overflow-hidden p-0.5 border-2 ${
                    chat.hasUnread ? 'border-[#FFCC00] shadow-md shadow-amber-500/10' : 'border-zinc-800'
                  }`}>
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm tracking-tight truncate">
                      {chat.name}
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-500 shrink-0">
                      {chat.timestamp}
                    </span>
                  </div>
                  <p className={`text-xs truncate font-medium ${
                    chat.hasUnread ? 'text-zinc-200 font-bold' : 'text-zinc-400'
                  }`}>
                    {chat.lastMessage}
                  </p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-5 z-30">
        <button
          onClick={() => setIsFriendSelectorOpen(true)}
          className="w-13 h-13 rounded-full bg-[#FFCC00] text-black shadow-2xl flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer border-2 border-black/20"
          title="Tạo trò chuyện mới"
        >
          <Pencil className="w-5 h-5 fill-current stroke-none" />
        </button>
      </div>

      {/* Image Preview Modal matching SetLog main feed interface */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-30 bg-[#0c0c0e] flex flex-col justify-between pt-16 pb-20 p-3 box-border overflow-hidden animate-fadeIn">
          <div className="w-full max-w-sm mx-auto h-full flex flex-col justify-between relative">
            {/* Top Header */}
            <div className="flex items-center justify-between py-1 px-1 z-20">
              <button 
                type="button" 
                onClick={() => setPreviewImageUrl(null)} 
                className="w-8 h-8 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white flex items-center justify-center cursor-pointer shadow-lg transition-all active:scale-95"
                title="Quay lại"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button 
                type="button"
                onClick={() => setPreviewImageUrl(null)} 
                className="w-8 h-8 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-sm cursor-pointer shadow-lg transition-all active:scale-95"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Photo Card */}
            <div className="relative flex-1 min-h-0 w-full max-w-sm mx-auto my-2 bg-black rounded-[38px] overflow-hidden shadow-2xl border border-zinc-800/80 group flex items-center justify-center">
              <img src={previewImageUrl} alt="SetLog Preview" className="w-full h-full object-cover" />
            </div>

            {/* Author details */}
            <div className="flex items-center justify-center gap-2 py-0.5">
              <span className="font-extrabold text-white text-sm">
                {(selectedConversation?.name || 'SetLog').toLowerCase()}
              </span>
            </div>

            {/* Bottom Bar */}
            <div className="w-full max-w-sm mx-auto space-y-2 pt-1 pb-2">
              <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-full px-3.5 py-2 flex items-center justify-between gap-2 shadow-lg">
                <input
                  type="text"
                  placeholder="Tin nhắn..."
                  className="flex-1 bg-transparent text-white text-xs font-medium outline-none placeholder:text-zinc-500 pl-1"
                />
                <div className="flex items-center gap-1">
                  {['🍲', '🥤', '🥄', '😁'].map((emoji) => (
                    <span key={emoji} className="p-1 text-sm">{emoji}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
