import React, { useState } from 'react';
import { Heart, MessageCircle, Eye, Share2, Sparkles, Camera, Star, Send, SmilePlus, Trash2 } from 'lucide-react';
import { MomentPost, UserProfile, PrivacyLevel } from '../types';

interface FeedAndInteractionsProps {
  moments: MomentPost[];
  currentUser: UserProfile;
  onAddReaction: (momentId: string, emoji: string) => void;
  onAddSelfieReaction: (momentId: string, selfieDataUrl: string) => void;
  onAddComment: (momentId: string, text: string) => void;
  onDeleteMoment?: (momentId: string) => void;
}

const formatTimeAgo = (timestamp: number): string => {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  
  if (diffMin < 60) {
    return `${Math.max(1, diffMin)}ph`;
  }
  
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours}giờ`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays}ngày`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths}tháng`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}năm`;
};

export const FeedAndInteractions: React.FC<FeedAndInteractionsProps> = ({
  moments,
  currentUser,
  onAddReaction,
  onAddSelfieReaction,
  onAddComment,
  onDeleteMoment
}) => {
  const [activeCommentMomentId, setActiveCommentMomentId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [id: string]: string }>({});
  const [activeSeenByModalId, setActiveSeenByModalId] = useState<string | null>(null);
  const [deleteConfirmMomentId, setDeleteConfirmMomentId] = useState<string | null>(null);

  const handleSendComment = (momentId: string) => {
    const text = commentInputs[momentId];
    if (!text || !text.trim()) return;
    onAddComment(momentId, text);
    setCommentInputs(prev => ({ ...prev, [momentId]: '' }));
  };

  const handleCaptureSelfieReaction = (momentId: string) => {
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

  return (
    <div className="h-full w-full">
      {moments.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 rounded-[36px] border border-zinc-800/80 text-zinc-500 text-xs space-y-3 my-8 mx-3">
          <Camera className="w-10 h-10 mx-auto text-zinc-600" />
          <p className="font-semibold text-zinc-400">Chưa có khoảnh khắc SetLog nào trong hôm nay.</p>
        </div>
      ) : (
        moments.map((moment) => {
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
          <div key={moment.id} className="h-full w-full snap-start snap-always shrink-0 flex flex-col justify-between p-3 pb-24 box-border select-none">
            
            {/* SETLOG PHOTO CARD - Flexible height fitting 1 frame */}
            <div className="relative flex-1 min-h-0 w-full bg-black rounded-[38px] overflow-hidden shadow-2xl border border-zinc-800/80 group">
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
                  <Camera className="w-10 h-10 mb-2 opacity-40" />
                  <span className="text-xs text-zinc-400 font-medium">Khoảnh khắc đã được lưu</span>
                </div>
              )}

              {/* Delete Button - Only shown if post belongs to current user */}
              {onDeleteMoment && isAuthor && (
                <button
                  onClick={() => setDeleteConfirmMomentId(moment.id)}
                  className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600/80 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/10"
                  title="Xóa bài đăng này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* Caption Overlay Pill - Matching Locket Screenshot */}
              {moment.caption && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 max-w-[85%] bg-[#2c2c2e]/90 backdrop-blur-md px-4 py-2 rounded-2xl text-center border border-zinc-700/60 shadow-xl z-10">
                  <span className="text-white text-xs font-bold leading-tight break-words">
                    {moment.caption}
                  </span>
                </div>
              )}

              {/* Selfie Reactions Overlay */}
              {moment.selfieReactions.length > 0 && (
                <div className="absolute bottom-4 right-4 flex items-center -space-x-2">
                  {moment.selfieReactions.map((sr) => (
                    <div key={sr.id} className="w-9 h-9 rounded-full border-2 border-[#FFCC00] overflow-hidden shadow-lg bg-black">
                      <img src={sr.reactionImageUrl} alt={sr.userName} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* AUTHOR DETAILS BELOW PHOTO - Matching Locket Screenshot */}
            <div className="flex items-center justify-center gap-2 py-0.5">
              <img
                src={displayAuthorAvatar}
                alt={displayAuthorName}
                className="w-6 h-6 rounded-full object-cover border border-zinc-700"
              />
              <span className="font-extrabold text-white text-sm">{displayAuthorName.toLowerCase()}</span>
              <span className="text-zinc-400 text-xs font-semibold">
                {formatTimeAgo(moment.capturedAt)}
              </span>
            </div>

            {/* REACTION & MESSAGE BAR - Matching Locket Screenshots */}
            <div className="space-y-2 pt-1">
              <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-full px-3.5 py-2 flex items-center justify-between gap-2 shadow-lg">
                <input
                  type="text"
                  placeholder="Tin nhắn..."
                  value={commentInputs[moment.id] || ''}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [moment.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendComment(moment.id)}
                  className="flex-1 bg-transparent text-white text-xs font-medium outline-none placeholder:text-zinc-500 pl-1"
                />

                {/* Quick Reaction Emoji Pills beside input */}
                <div className="flex items-center gap-1">
                  {['💪', '🏋️', '💖', '🥳'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onAddReaction(moment.id, emoji)}
                      className="p-1 hover:scale-125 transition-transform cursor-pointer text-sm"
                    >
                      {emoji}
                    </button>
                  ))}

                  {/* Selfie Reaction Camera Button */}
                  <button
                    type="button"
                    onClick={() => handleCaptureSelfieReaction(moment.id)}
                    className="w-7 h-7 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 ml-0.5"
                    title="Chụp Selfie Reaction"
                  >
                    <SmilePlus className="w-4 h-4 text-[#FFCC00]" />
                  </button>

                  {/* Send Comment Button if typed */}
                  {commentInputs[moment.id]?.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSendComment(moment.id)}
                      className="w-7 h-7 rounded-full bg-[#FFCC00] text-black font-extrabold flex items-center justify-center transition-all cursor-pointer active:scale-90"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status pill or reactions list */}
              {isAuthor ? (
                /* Post author view: can see 'Chưa có hoạt động nào!' or views count button to inspect reactions & views */
                moment.reactions.length === 0 && (moment.seenBy?.length || 0) === 0 ? (
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveSeenByModalId(moment.id)}
                      className="bg-[#2c2c2e]/80 hover:bg-[#3a3a3c] text-zinc-300 hover:text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-zinc-700/50 shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <span>✨ Chưa có hoạt động nào!</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3 text-[11px] text-zinc-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      {moment.reactions.map((r, i) => (
                        <span key={i} className="bg-zinc-800/60 px-2.5 py-1 rounded-full text-zinc-300 font-semibold">
                          {r.emoji} {r.count}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveSeenByModalId(moment.id)}
                      className="flex items-center gap-1 bg-[#2c2c2e]/80 hover:bg-[#3a3a3c] text-zinc-300 hover:text-white px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ml-auto border border-zinc-700/50"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#FFCC00]" />
                      <span>Đã xem ({moment.seenBy?.length || 0})</span>
                    </button>
                  </div>
                )
              ) : (
                /* Non-author view: shows reactions summary only when present */
                moment.reactions.length > 0 && (
                  <div className="flex items-center justify-center gap-1.5 px-3 text-[11px] text-zinc-400 pt-1">
                    {moment.reactions.map((r, i) => (
                      <span key={i} className="bg-zinc-800/60 px-2.5 py-1 rounded-full text-zinc-300 font-semibold">
                        {r.emoji} {r.count}
                      </span>
                    ))}
                  </div>
                )
              )}
            </div>

          </div>
        );
        })
      )}

      {/* Seen By / Activity Modal */}
      {activeSeenByModalId && (() => {
        const targetMoment = moments.find(m => m.id === activeSeenByModalId);
        if (!targetMoment) return null;

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-[#121215] border border-zinc-800 rounded-3xl p-4 space-y-3 shadow-2xl">
              <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2">
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#FFCC00]" />
                  Tương tác & Lượt xem
                </h3>
                <button onClick={() => setActiveSeenByModalId(null)} className="text-zinc-400 hover:text-white cursor-pointer font-bold">
                  ✕
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {/* Jmote Reactions */}
                {targetMoment.reactions.length > 0 && (
                  <div className="p-2.5 bg-black/40 rounded-2xl border border-zinc-800/60 space-y-1">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Cảm xúc Jmote:</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {targetMoment.reactions.map((r, i) => (
                        <span key={i} className="bg-zinc-800 px-2.5 py-1 rounded-full text-xs font-bold text-white border border-zinc-700/50">
                          {r.emoji} {r.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selfie Reactions */}
                {targetMoment.selfieReactions.length > 0 && (
                  <div className="p-2.5 bg-black/40 rounded-2xl border border-zinc-800/60 space-y-1.5">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Selfie Reaction:</span>
                    <div className="space-y-1.5">
                      {targetMoment.selfieReactions.map((sr) => (
                        <div key={sr.id} className="flex items-center gap-2 text-xs">
                          <img src={sr.reactionImageUrl} alt={sr.userName} className="w-7 h-7 rounded-full object-cover border border-[#FFCC00]" />
                          <span className="font-semibold text-white">{sr.userName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Viewers list */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider px-1">
                    Người đã xem ({targetMoment.seenBy.length}):
                  </span>
                  {targetMoment.seenBy.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic px-1">Chưa có lượt xem nào.</p>
                  ) : (
                    targetMoment.seenBy.map((v, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2 bg-black/40 rounded-2xl border border-zinc-800/40">
                        <div className="flex items-center gap-2">
                          <img src={v.avatar} alt={v.userName} className="w-6 h-6 rounded-full object-cover" />
                          <span className="font-semibold text-white">{v.userName}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Delete Confirmation Modal - Locket iOS Style */}
      {deleteConfirmMomentId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-[280px] bg-[#1c1c1e] border border-zinc-800/80 rounded-[28px] p-6 text-center shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-lg font-extrabold text-white tracking-tight">Xóa ảnh?</h3>
            <p className="text-zinc-300 text-xs font-medium leading-relaxed">
              Việc này sẽ xóa vĩnh viễn ảnh khỏi lịch sử của bạn và bạn bè của bạn sẽ không còn có thể thấy ảnh này nữa.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmMomentId(null)}
                className="flex-1 py-3 rounded-full bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white font-bold text-sm transition-all cursor-pointer active:scale-95"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (onDeleteMoment) onDeleteMoment(deleteConfirmMomentId);
                  setDeleteConfirmMomentId(null);
                }}
                className="flex-1 py-3 rounded-full bg-[#2c2c2e] hover:bg-red-950/40 text-[#ff453a] font-bold text-sm transition-all cursor-pointer active:scale-95 border border-red-500/10"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
