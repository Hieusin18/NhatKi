import React from 'react';
import { LayoutGrid, MessageSquare, Camera, Share2, Home } from 'lucide-react';

export type TabType = 'feed' | 'capture' | 'friends' | 'memories';

interface BottomTabsProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  unreadChatCount?: number;
}

export const BottomTabs: React.FC<BottomTabsProps> = ({
  activeTab,
  onChangeTab,
  unreadChatCount = 0
}) => {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-[#1c1c1e]/90 backdrop-blur-xl border border-zinc-800/80 rounded-full px-4 py-2 z-50 flex items-center justify-between shadow-2xl shadow-black/80">
      
      {/* 1. Grid Icon (Memories / All Photos) */}
      <button
        onClick={() => onChangeTab('memories')}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
          activeTab === 'memories' ? 'bg-zinc-800 text-[#FFCC00]' : 'text-zinc-400 hover:text-white'
        }`}
        title="Lưới ảnh & Kỷ niệm"
      >
        <LayoutGrid className="w-5 h-5" />
      </button>

      {/* 2. Feed View / Home Toggle */}
      <button
        onClick={() => onChangeTab('feed')}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
          activeTab === 'feed' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
        }`}
        title="Bảng tin SetLog"
      >
        <Home className="w-5 h-5" />
      </button>

      {/* 3. Center Main Shutter / Camera Capture Button */}
      <button
        onClick={() => onChangeTab('capture')}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all transform active:scale-90 cursor-pointer ${
          activeTab === 'capture'
            ? 'border-4 border-[#FFCC00] bg-white shadow-lg shadow-amber-500/20 scale-105'
            : 'border-2 border-[#FFCC00]/80 bg-zinc-900 hover:bg-zinc-800 text-[#FFCC00]'
        }`}
        title="Chụp 2s SetLog"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          activeTab === 'capture' ? 'bg-white text-black' : 'bg-[#FFCC00] text-black font-extrabold'
        }`}>
          <Camera className="w-5 h-5" />
        </div>
      </button>

      {/* 4. Chat / Friends with Unread Yellow Badge */}
      <button
        onClick={() => onChangeTab('friends')}
        className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
          activeTab === 'friends' ? 'bg-zinc-800 text-[#FFCC00]' : 'text-zinc-400 hover:text-white'
        }`}
        title="Tin nhắn & Bạn bè"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadChatCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-[#FFCC00] rounded-full text-[9px] font-extrabold text-black flex items-center justify-center border border-black shadow-sm">
            {unreadChatCount}
          </span>
        )}
      </button>

      {/* 5. Share / Export Button */}
      <button
        onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: 'SetLog App',
              text: 'Tham gia SetLog 2s với tôi!',
              url: window.location.href,
            }).catch(() => {});
          } else {
            alert('Đã sao chép liên kết chia sẻ SetLog!');
          }
        }}
        className="w-11 h-11 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer active:scale-90"
        title="Chia sẻ ứng dụng"
      >
        <Share2 className="w-5 h-5" />
      </button>

    </nav>
  );
};


