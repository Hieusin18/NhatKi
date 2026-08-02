import React, { useState, useRef, useEffect } from 'react';
import { Camera, Zap, RefreshCw, MapPin, ChevronDown, History, Image as ImageIcon } from 'lucide-react';
import { PrivacyLevel } from '../types';

interface DualCameraCaptureProps {
  onPublishMoment: (momentData: {
    primaryMediaUrl: string;
    secondaryMediaUrl?: string;
    mediaType: 'image' | 'video_15s' | 'clip_2s';
    caption: string;
    locationName?: string;
    privacy: PrivacyLevel;
    lateMinutes: number;
    retakeCount: number;
  }) => void;
  recentMoments?: string[];
  onOpenHistory?: () => void;
}

export const DualCameraCapture: React.FC<DualCameraCaptureProps> = ({
  onPublishMoment,
  recentMoments = [
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80'
  ],
  onOpenHistory
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedClip, setRecordedClip] = useState<string | null>(null);
  const [selfieSnapshot, setSelfieSnapshot] = useState<string | null>(null);
  const [retakeCount, setRetakeCount] = useState(0);
  const [caption, setCaption] = useState('');
  const [locationName, setLocationName] = useState('Quận 1, TP.HCM');
  const [enableGps, setEnableGps] = useState(true);
  const [privacy, setPrivacy] = useState<PrivacyLevel>('public_friends');
  const [captureMode, setCaptureMode] = useState<'clip_2s' | 'image' | 'video_15s'>('clip_2s');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'1x' | '2x' | '0.5x'>('1x');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const lateMinutes = 0; 

  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isZoomSupported, setIsZoomSupported] = useState(false);
  const [hardwareToast, setHardwareToast] = useState<string | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const showHardwareToast = (msg: string) => {
    setHardwareToast(msg);
    setTimeout(() => setHardwareToast(null), 2500);
  };

  const startWebcam = async (modeToUse?: 'user' | 'environment') => {
    const targetFacing = modeToUse || facingMode;
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 720 }, height: { ideal: 1280 }, facingMode: targetFacing }, 
        audio: captureMode !== 'image' 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack && videoTrack.getCapabilities) {
        const caps = videoTrack.getCapabilities() as any;
        setIsTorchSupported(!!caps.torch);
        setIsZoomSupported(!!caps.zoom);
      }
    } catch (err) {
      console.warn("Webcam access prevented or not available:", err);
    }
  };

  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    showHardwareToast(nextFacing === 'user' ? 'Đã chuyển Camera Trước' : 'Đã chuyển Camera Sau');
    startWebcam(nextFacing);
  };

  const handleToggleFlash = async () => {
    const videoTrack = stream?.getVideoTracks()[0];
    if (!videoTrack) {
      showHardwareToast('Chưa khởi chạy Camera');
      return;
    }

    const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;
    if (capabilities.torch) {
      try {
        const nextState = !isFlashOn;
        await videoTrack.applyConstraints({
          advanced: [{ torch: nextState }] as any
        });
        setIsFlashOn(nextState);
        showHardwareToast(nextState ? 'Đã bật Đèn Flash (Torch)' : 'Đã tắt Đèn Flash');
      } catch (err) {
        showHardwareToast('Không thể bật Flash phần cứng');
      }
    } else {
      setIsFlashOn(!isFlashOn);
      showHardwareToast('Thiết bị/Trình duyệt không hỗ trợ Flash phần cứng');
    }
  };

  const handleToggleZoom = async () => {
    const nextZoom = zoomLevel === '1x' ? '2x' : zoomLevel === '2x' ? '0.5x' : '1x';
    setZoomLevel(nextZoom);

    const videoTrack = stream?.getVideoTracks()[0];
    if (videoTrack && videoTrack.getCapabilities) {
      const capabilities = videoTrack.getCapabilities() as any;
      if (capabilities.zoom) {
        try {
          const zoomVal = nextZoom === '2x' ? (capabilities.zoom.max || 2) : nextZoom === '0.5x' ? (capabilities.zoom.min || 0.5) : 1;
          await videoTrack.applyConstraints({
            advanced: [{ zoom: zoomVal }] as any
          });
          showHardwareToast(`Zoom quang học phần cứng: ${nextZoom}`);
          return;
        } catch (err) {
          console.warn("Optical zoom error:", err);
        }
      }
    }
    showHardwareToast(`Zoom kỹ thuật số: ${nextZoom}`);
  };

  useEffect(() => {
    startWebcam();
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [captureMode]);

  const handleStartCapture = () => {
    if (retakeCount >= 3) {
      alert("Bạn đã hết 3 lượt Chụp lại (Retake) hôm nay!");
      return;
    }

    if (!stream) {
      alert("Không tìm thấy thiết bị Camera hoặc quyền truy cập Camera bị từ chối. Vui lòng cấp quyền Camera cho trình duyệt để chụp khoảnh khắc.");
      startWebcam();
      return;
    }

    if (captureMode === 'image') {
      const video = videoRef.current;
      if (video) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setRecordedClip(canvas.toDataURL('image/jpeg'));
          setSelfieSnapshot(canvas.toDataURL('image/jpeg'));
        }
      }
      return;
    }

    // Video Recording (2s duration lock)
    if (stream) {
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setRecordedClip(reader.result as string);
          setSelfieSnapshot(reader.result as string);
        };
      };
      recorder.start();
      setIsRecording(true);

      const recordTime = captureMode === 'clip_2s' ? 2000 : 15000;
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setIsRecording(false);
        }
      }, recordTime);
    }
  };

  const handleRetake = () => {
    setRecordedClip(null);
    setSelfieSnapshot(null);
    setRetakeCount(prev => prev + 1);
    startWebcam();
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!recordedClip || isPublishing) return;
    setIsPublishing(true);
    try {
      await onPublishMoment({
        primaryMediaUrl: recordedClip,
        secondaryMediaUrl: selfieSnapshot || undefined,
        mediaType: captureMode,
        caption,
        locationName: enableGps ? locationName : undefined,
        privacy,
        lateMinutes,
        retakeCount
      });
    } catch (err) {
      console.error("Publish error:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="p-3 max-w-md mx-auto space-y-4 pb-28">
      
      {/* CAMERA VIEWFINDER - Ultra Rounded Squircle matching Locket Screenshot 2 */}
      <div className="relative aspect-[3/3.8] bg-black rounded-[38px] overflow-hidden border border-zinc-800/80 shadow-2xl flex items-center justify-center">
        {/* Hardware Toast Notification */}
        {hardwareToast && (
          <div className="absolute top-16 z-30 px-3 py-1.5 bg-black/80 backdrop-blur-md border border-[#FFCC00]/50 text-[#FFCC00] text-[11px] font-bold rounded-full shadow-lg animate-fade-in">
            {hardwareToast}
          </div>
        )}

        {!recordedClip ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover transform transition-transform duration-300 ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              } ${
                zoomLevel === '2x' ? 'scale-125' : zoomLevel === '0.5x' ? 'scale-90' : ''
              }`}
            />

            {/* Flash Toggle Button Top-Left */}
            <button
              onClick={handleToggleFlash}
              className={`absolute top-4 left-4 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${
                isFlashOn ? 'bg-[#FFCC00] text-black font-bold' : 'bg-black/40 text-white hover:bg-black/60'
              }`}
              title={isTorchSupported ? "Bật/Tắt Đèn Flash" : "Bật/Tắt Flash (Kỹ thuật số)"}
            >
              <Zap className="w-4 h-4 fill-current" />
            </button>

            {/* Zoom Toggle Pill Top-Right */}
            <button
              onClick={handleToggleZoom}
              className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold border border-white/10 hover:bg-black/60 transition-all cursor-pointer"
            >
              {zoomLevel}
            </button>

            {/* Recording Overlay */}
            {isRecording && (
              <div className="absolute inset-0 border-4 border-[#FFCC00] animate-pulse flex items-center justify-center bg-black/30 backdrop-blur-xs">
                <span className="px-4 py-2 bg-[#FFCC00] text-black font-extrabold text-xs rounded-full shadow-lg animate-bounce">
                  {captureMode === 'clip_2s' ? 'Đang ghi 2s... 🔴' : 'Đang ghi 15s... 🔴'}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="relative w-full h-full">
            {captureMode === 'image' ? (
              <img src={recordedClip} alt="Moment Preview" className="w-full h-full object-cover" />
            ) : (
              <video src={recordedClip} autoPlay loop playsInline className="w-full h-full object-cover" />
            )}
          </div>
        )}
      </div>

      {/* CONTROLS BAR BELOW VIEWFINDER - Matching Locket Video Demo */}
      {!recordedClip ? (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-6 pt-1">
            
            {/* Left: Gallery Thumbnail Preview */}
            <button
              onClick={onOpenHistory}
              className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-zinc-700/80 hover:border-white transition-all cursor-pointer shadow-md bg-zinc-900 flex items-center justify-center active:scale-90"
              title="Thư viện ảnh"
            >
              {recentMoments[0] ? (
                <img src={recentMoments[0]} alt="Recent photo" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-5 h-5 text-zinc-400" />
              )}
            </button>

            {/* Center: Big Shutter Yellow-Ring Camera Button */}
            <button
              onClick={handleStartCapture}
              className="relative w-20 h-20 rounded-full border-4 border-[#FFCC00] bg-white flex items-center justify-center shadow-2xl shadow-amber-500/20 cursor-pointer transform active:scale-90 transition-transform"
              title="Chụp ngay"
            >
              <div className="w-14 h-14 rounded-full border-2 border-zinc-200 bg-white flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white border border-zinc-300" />
              </div>
            </button>

            {/* Right: Camera Flip Button */}
            <button
              onClick={handleFlipCamera}
              className="w-12 h-12 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-md"
              title="Xoay camera trước / sau"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

          </div>

          {/* HISTORY TRIGGER DROPDOWN BUTTON BELOW SHUTTER */}
          <div className="flex justify-center pt-1">
            <button
              onClick={onOpenHistory}
              className="px-4 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 rounded-full text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-700/60 shadow-md active:scale-95"
            >
              <History className="w-3.5 h-3.5 text-[#FFCC00]" />
              <span>Lịch sử</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
        </div>
      ) : (
        /* PUBLISH / SEND SCREEN MATCHING VIDEO 0:15 - 0:23 */
        <div className="space-y-4">
          {/* Top Bar: "Gửi đến..." & Download */}
          <div className="flex items-center justify-between px-2 text-white">
            <span className="font-extrabold text-sm tracking-tight">Gửi đến...</span>
            <button 
              type="button" 
              onClick={() => alert("Đã lưu ảnh vào máy!")}
              className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Tải xuống"
            >
              📥
            </button>
          </div>

          {/* Caption Overlay Bar */}
          <div className="space-y-2">
            <div className="relative bg-[#2c2c2e]/90 border border-zinc-700/60 rounded-2xl px-4 py-3 flex items-center justify-between shadow-xl">
              <input 
                type="text" 
                placeholder="Thêm một tin nhắn"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-400 font-medium"
              />
            </div>
            {/* Pagination dots indicator */}
            <div className="flex justify-center gap-1 text-zinc-500 text-[10px]">
              <span>•</span>
              <span className="text-white">•</span>
              <span>•</span>
              <span>•</span>
              <span>•</span>
              <span>•</span>
            </div>
          </div>

          {/* Action Buttons Row: Cancel (X) | Send (✈) | Aa+ */}
          <div className="flex items-center justify-between px-6 py-1">
            {/* Cancel / Retake X Button */}
            <button
              onClick={handleRetake}
              className="w-12 h-12 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-lg"
              title="Chụp lại"
            >
              <span className="text-xl font-bold">✕</span>
            </button>

            {/* Center Yellow Send Arrow Button */}
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className={`w-16 h-16 rounded-full bg-[#FFCC00] hover:bg-[#e6b800] text-black flex items-center justify-center transition-all shadow-2xl shadow-amber-500/30 ${
                isPublishing ? 'opacity-70 cursor-not-allowed scale-95' : 'cursor-pointer active:scale-95'
              }`}
              title={isPublishing ? "Đang gửi..." : "Gửi ngay"}
            >
              {isPublishing ? (
                <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-2xl font-black transform -rotate-45 translate-x-0.5 -translate-y-0.5">➢</span>
              )}
            </button>

            {/* Text Aa+ Button */}
            <button
              onClick={() => {
                const text = prompt("Nhập văn bản lên ảnh:", caption);
                if (text !== null) setCaption(text);
              }}
              className="w-12 h-12 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer active:scale-90 shadow-lg"
              title="Thêm chữ"
            >
              Aa+
            </button>
          </div>

          {/* Recipient Target Selection Bar at Bottom */}
          <div className="flex items-center justify-center gap-4 overflow-x-auto py-2 px-1">
            <button 
              onClick={() => setPrivacy('public_friends')}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-transform active:scale-90 ${
                privacy === 'public_friends' ? 'opacity-100 scale-105' : 'opacity-60'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#FFCC00] text-black font-black flex items-center justify-center text-xs shadow-md">
                👥
              </div>
              <span className="text-[10px] font-bold text-amber-400">Tất cả</span>
            </button>

            <button 
              onClick={() => setPrivacy('close_friends')}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-transform active:scale-90 ${
                privacy === 'close_friends' ? 'opacity-100 scale-105' : 'opacity-60'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-[#FFCC00] flex items-center justify-center text-xs font-bold text-white shadow-md">
                ⭐
              </div>
              <span className="text-[10px] font-medium text-zinc-300">Bạn thân</span>
            </button>

            <button 
              onClick={() => setPrivacy('private')}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-transform active:scale-90 ${
                privacy === 'private' ? 'opacity-100 scale-105' : 'opacity-60'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shadow-md">
                🔒
              </div>
              <span className="text-[10px] font-medium text-zinc-300">Chỉ mình tôi</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

