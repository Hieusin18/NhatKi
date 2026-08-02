import React, { useState } from 'react';
import { Megaphone, ChevronDown, ChevronRight, Users, User } from 'lucide-react';
import { UserProfile, AppNotification } from '../types';

interface NavigationHeaderProps {
  user: UserProfile | null;
  friends?: { id: string; name: string; username: string; avatar: string }[];
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onOpenAuthModal: () => void;
  activeTab: string;
  selectedFilter?: string;
  onSelectFilter?: (filter: string) => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  user,
  friends = [],
  notifications,
  onOpenNotifications,
  onOpenAuthModal,
  activeTab,
  selectedFilter = 'Mọi người',
  onSelectFilter
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const filterOptions: Array<{ id: string; name: string; isAll?: boolean; avatar?: string }> = [
    { id: 'Mọi người', name: 'Mọi người', isAll: true },
    ...(user ? [{ id: 'Bạn', name: `Bạn (${user.displayName})`, avatar: user.avatarUrl }] : []),
    ...friends
      .filter(f => f.id !== user?.id && f.name !== user?.displayName)
      .map(f => ({
        id: f.id,
        name: f.name || f.username || 'Bạn bè',
        avatar: f.avatar
      }))
  ];

  const currentOption = filterOptions.find(o => o.id === selectedFilter || o.name === selectedFilter);
  const displayPillText = currentOption ? currentOption.name : selectedFilter;

  return (
    <header className="px-4 py-3 bg-[#0c0c0e]/95 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between border-b border-zinc-900/60">
      {/* Left: Button for Notifications */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenNotifications}
          className="relative w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 flex items-center justify-center text-white transition-all cursor-pointer active:scale-95 shadow-md"
          title="Thông báo & Hoạt động"
        >
          <Megaphone className="w-4 h-4 text-zinc-200" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FFCC00] rounded-full text-[9px] font-extrabold text-black flex items-center justify-center border border-black shadow-sm">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Center: Locket Dropdown Selector Pill */}
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="px-4 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 rounded-full text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-98"
        >
          {activeTab === 'capture' ? (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#FFCC00]" />
              <span>Mọi người</span>
            </span>
          ) : (
            <span className="truncate max-w-[140px]">{displayPillText}</span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Backdrop overlay to close when clicking outside */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Dropdown Menu Popup - Exactly matching Locket screenshot */}
        {isMenuOpen && (
          <div className="absolute top-11 left-1/2 -translate-x-1/2 w-64 bg-[#2c2c2e]/95 backdrop-blur-2xl border border-zinc-700/70 rounded-3xl p-2 shadow-2xl z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150 max-h-80 overflow-y-auto">
            {filterOptions.map((item) => {
              const isSelected = selectedFilter === item.id || selectedFilter === item.name;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (onSelectFilter) onSelectFilter(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                    isSelected ? 'bg-zinc-700/90 text-white font-extrabold' : 'hover:bg-zinc-800/70 text-zinc-200 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.isAll ? (
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                    ) : (
                      <img 
                        src={item.avatar} 
                        alt={item.name} 
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-zinc-600" 
                      />
                    )}
                    <span className="text-xs font-bold tracking-tight text-white">{item.name}</span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: User Avatar Circular Button */}
      {user ? (
        <button
          onClick={onOpenAuthModal}
          className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-zinc-700 hover:border-[#FFCC00] transition-all cursor-pointer active:scale-95 shadow-md shrink-0"
          title={user.displayName}
        >
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="w-full h-full object-cover"
          />
        </button>
      ) : (
        <button
          onClick={onOpenAuthModal}
          className="w-9 h-9 rounded-full bg-[#FFCC00] text-black font-extrabold flex items-center justify-center text-xs cursor-pointer shadow-md active:scale-95"
          title="Đăng nhập"
        >
          <User className="w-4 h-4" />
        </button>
      )}
    </header>
  );
};


