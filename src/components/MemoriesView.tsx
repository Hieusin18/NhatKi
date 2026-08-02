import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Volume2, ChevronDown, X, Trash2, SmilePlus, Send, ArrowLeft } from 'lucide-react';
import { MomentPost, UserProfile } from '../types';

interface MemoriesViewProps {
  moments: MomentPost[];
  currentUser?: UserProfile;
  onAddReaction?: (momentId: string, emoji: string) => void;
  onAddSelfieReaction?: (momentId: string, selfieDataUrl: string) => void;
  onAddComment?: (momentId: string, text: string) => void;
  onDeleteMoment?: (momentId: string) => void;
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({
  moments,
  currentUser,
  onAddReaction,
  onAddSelfieReaction,
  onAddComment,
  onDeleteMoment,
}) => {
  const [selectedMoment, setSelectedMoment] = useState<MomentPost | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [momentId: string]: string }>({});

  // Automatically scroll to the selected moment when full-screen viewer opens
  useEffect(() => {
    if (selectedMoment) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`memory-slide-${selectedMoment.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [selectedMoment?.id]);

  const handleCaptureSelfieReaction = (momentId: string) => {
    if (!onAddSelfieReaction) return;
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'user';
    fileInput.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            onAddSelfieReaction(momentId, event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  const formatTimeAgo = (timestamp: number) => {
    const minutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
    if (minutes < 60) return `${minutes}ph`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}g`;
    return new Date(timestamp).toLocaleDateString([], { day: 'numeric', month: 'numeric' });
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-zinc-900 to-[#121215] border border-zinc-800/80 rounded-2xl flex items-center justify-between shadow-lg">
        <div>
          <h2 className="font-extrabold text-white text-sm flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#FFCC00]" />
            Dòng thời gian Kỷ niệm
          </h2>
          <p className="text-xs text-zinc-400">Xem lại các khoảnh khắc 2s theo ngày tháng</p>
        </div>
        <span className="text-xs font-bold text-[#FFCC00] bg-[#FFCC00]/10 px-2.5 py-1 rounded-full border border-[#FFCC00]/20 font-mono">
          {moments.length} bài
        </span>
      </div>

      {/* Grid of Moments */}
      {moments.length === 0 ? (
        <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
          Chưa có kỷ niệm nào được lưu trữ.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {moments.map((moment) => (
            <button
              key={moment.id}
              onClick={() => {
                setSelectedMoment(moment);
              }}
              className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-800/80 bg-black group hover:border-[#FFCC00] transition-all cursor-pointer shadow-md active:scale-95"
            >
              {moment.mediaType === 'image' ? (
                <img src={moment.primaryMediaUrl} alt="Memory" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
              ) : (
                <video src={moment.primaryMediaUrl} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                <span className="text-[10px] font-bold text-white font-mono">
                  {new Date(moment.capturedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail View - Full-screen Snap/Paging Scroll (TikTok / Instagram Reels style) */}
      {selectedMoment && (
        <div className="fixed inset-0 z-30 bg-[#0c0c0e] flex flex-col pt-16 pb-20 box-border overflow-hidden animate-fadeIn">
          {/* Top Bar Controls */}
          <div className="absolute top-18 left-0 right-0 z-40 px-4 flex items-center justify-between max-w-sm mx-auto pointer-events-none">
            <button 
              type="button" 
              onClick={() => setSelectedMoment(null)}
              className="w-8 h-8 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white flex items-center justify-center cursor-pointer shadow-lg transition-all active:scale-95 pointer-events-auto"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-extrabold text-zinc-300 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-md">
              Vuốt để xem bài khác ↑↓
            </span>

            <button 
              type="button"
              onClick={() => setSelectedMoment(null)} 
              className="w-8 h-8 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-sm cursor-pointer shadow-lg transition-all active:scale-95 pointer-events-auto"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Vertical Snap Scroll Container */}
          <div className="w-full h-full overflow-y-auto snap-y snap-mandatory scroll-smooth [scrollbar-width:none] [::-webkit-scrollbar]:hidden">
            {moments.map((moment) => {
              const commentText = commentInputs[moment.id] || '';
              const isAuthor = Boolean(
                currentUser && (
                  moment.userId === currentUser.id ||
                  (moment as any).memberId === currentUser.id ||
                  moment.userName === 'Bạn' ||
                  (currentUser.displayName && (
                    moment.userName === currentUser.displayName ||
                    moment.userName?.toLowerCase() === currentUser.displayName.toLowerCase()
                  ))
                )
              );

              const displayAuthorName = isAuthor && currentUser?.displayName
                ? currentUser.displayName
                : (moment.userName || (moment as any).authorName || 'Bạn');

              const displayAuthorAvatar = isAuthor && currentUser?.avatarUrl
                ? currentUser.avatarUrl
                : (moment.userAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80');

              return (
                <div 
                  key={moment.id}
                  id={`memory-slide-${moment.id}`}
                  className="w-full h-full snap-start snap-always shrink-0 flex flex-col justify-between p-3 pb-24 box-border max-w-sm mx-auto pt-8 select-none"
                >
                  {/* Photo Card */}
                  <div className="relative flex-1 min-h-0 w-full bg-black rounded-[38px] overflow-hidden shadow-2xl border border-zinc-800/80 group flex items-center justify-center">
                    {moment.primaryMediaUrl ? (
                      moment.mediaType === 'image' ? (
                        <img src={moment.primaryMediaUrl} alt="SetLog Moment" className="w-full h-full object-cover" />
                      ) : (
                        <video 
                          src={moment.primaryMediaUrl} 
                          autoPlay 
                          loop 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover" 
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 p-4">
                        <span className="text-xs text-zinc-400 font-medium">Khoảnh khắc SetLog</span>
                      </div>
                    )}

                    {/* Delete button for own posts */}
                    {onDeleteMoment && isAuthor && (
                      <button
                        onClick={() => {
                          onDeleteMoment(moment.id);
                          if (moments.length <= 1) {
                            setSelectedMoment(null);
                          }
                        }}
                        className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600/80 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/10"
                        title="Xóa bài đăng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Caption Overlay Pill */}
                    {moment.caption && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[85%] bg-[#2c2c2e]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl text-center border border-zinc-700/60 shadow-xl z-10">
                        <span className="text-white text-xs font-bold leading-tight break-words">
                          {moment.caption}
                        </span>
                      </div>
                    )}

                    {/* Selfie Reactions Overlay */}
                    {moment.selfieReactions && moment.selfieReactions.length > 0 && (
                      <div className="absolute bottom-4 right-4 flex items-center -space-x-2 z-10">
                        {moment.selfieReactions.map((sr) => (
                          <div key={sr.id} className="w-9 h-9 rounded-full border-2 border-[#FFCC00] overflow-hidden shadow-lg bg-black">
                            <img src={sr.reactionImageUrl} alt={sr.userName} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Author Details */}
                  <div className="flex items-center justify-center gap-2 py-0.5">
                    <img
                      src={displayAuthorAvatar}
                      alt={displayAuthorName}
                      className="w-6 h-6 rounded-full object-cover border border-zinc-700 shadow-sm"
                    />
                    <span className="font-extrabold text-white text-sm">
                      {displayAuthorName.toLowerCase()}
                    </span>
                    <span className="text-zinc-400 text-xs font-semibold">
                      {formatTimeAgo(moment.capturedAt)}
                    </span>
                  </div>

                  {/* Reaction & Message Bar */}
                  <div className="w-full max-w-sm mx-auto space-y-2 pt-1 pb-2">
                    <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-full px-3.5 py-2 flex items-center justify-between gap-2 shadow-lg">
                      <input
                        type="text"
                        placeholder="Tin nhắn..."
                        value={commentText}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [moment.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && commentText.trim() && onAddComment) {
                            onAddComment(moment.id, commentText.trim());
                            setCommentInputs(prev => ({ ...prev, [moment.id]: '' }));
                          }
                        }}
                        className="flex-1 bg-transparent text-white text-xs font-medium outline-none placeholder:text-zinc-500 pl-1"
                      />

                      {/* Quick Emojis */}
                      <div className="flex items-center gap-1">
                        {['🍲', '🥤', '🥄', '😁', '💖'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => onAddReaction && onAddReaction(moment.id, emoji)}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer text-sm"
                          >
                            {emoji}
                          </button>
                        ))}

                        {/* Selfie Reaction Button */}
                        {onAddSelfieReaction && (
                          <button
                            type="button"
                            onClick={() => handleCaptureSelfieReaction(moment.id)}
                            className="w-7 h-7 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 ml-0.5"
                            title="Chụp Selfie Reaction"
                          >
                            <SmilePlus className="w-4 h-4 text-[#FFCC00]" />
                          </button>
                        )}

                        {/* Send Button */}
                        {commentText.trim() && onAddComment && (
                          <button
                            type="button"
                            onClick={() => {
                              onAddComment(moment.id, commentText.trim());
                              setCommentInputs(prev => ({ ...prev, [moment.id]: '' }));
                            }}
                            className="w-7 h-7 rounded-full bg-[#FFCC00] text-black font-extrabold flex items-center justify-center transition-all cursor-pointer active:scale-90"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
