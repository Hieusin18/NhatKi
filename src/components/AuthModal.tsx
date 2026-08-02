import React, { useState } from 'react';
import { 
  X, Shield, Smartphone, Mail, Key, LogOut, CheckCircle, RefreshCw, Lock, 
  User, Users, ArrowLeft, Send, Sparkles, AlertCircle, Laptop, PhoneCall, Check, 
  AtSign, Globe, Fingerprint, ShieldCheck, ChevronLeft, Pencil
} from 'lucide-react';
import { UserProfile, ActiveSession } from '../types';
import { 
  loginWithEmailFirebase, 
  registerWithEmailFirebase, 
  loginWithGoogleFirebase,
  loginWithFacebookFirebase,
  loginWithAppleFirebase,
  sendPasswordResetFirebase,
  getFirebaseErrorMessage
} from '../services/authService';
import { 
  syncUserProfileToFirestore, 
  removeSessionFromFirestore, 
  fetchUserSessionsFromFirestore,
  subscribeToUserFriends
} from '../lib/firebase';

interface AuthModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onLogout: () => void;
  onOpenFriends?: () => void;
  friendsCount?: number;
}

type AuthMode = 'landing' | 'login_flow' | 'register_flow' | 'forgot_password' | '2fa_verify' | 'onboarding' | 'account_settings' | 'edit_name';
type AuthStep = 'name' | 'username' | 'email' | 'password' | 'phone' | 'otp';

const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: 'sess_cur',
    deviceName: 'iPhone 15 Pro (Ứng dụng SetLog)',
    deviceType: 'mobile',
    ipAddress: '113.161.42.18',
    location: 'Quận 1, TP. Hồ Chí Minh',
    lastActiveTime: Date.now(),
    isCurrent: true,
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1X215X3Byb2ZpbGUiLCJpYXQiOjE3MDk4ODAwMDB9...',
    refreshToken: 'ref_98a7sd89a7sd89a7f8d7...',
    expiresAt: Date.now() + 1000 * 3600 * 24
  },
  {
    id: 'sess_mac',
    deviceName: 'MacBook Pro M2 (Chrome Web)',
    deviceType: 'desktop',
    ipAddress: '14.226.12.90',
    location: 'Cầu Giấy, Hà Nội',
    lastActiveTime: Date.now() - 1000 * 3600 * 3,
    isCurrent: false,
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1X215X3Byb2ZpbGUiLCJpYXQiOjE3MDk4NjAwMDB9...',
    refreshToken: 'ref_324n23k423k423k423...',
    expiresAt: Date.now() + 1000 * 3600 * 12
  },
  {
    id: 'sess_tab',
    deviceName: 'iPad Air 5 (Safari)',
    deviceType: 'tablet',
    ipAddress: '118.69.182.5',
    location: 'Hải Phòng',
    lastActiveTime: Date.now() - 1000 * 3600 * 28,
    isCurrent: false,
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1X215X3Byb2ZpbGUiLCJpYXQiOjE3MDk3NDAwMDB9...',
    refreshToken: 'ref_78s6d7f86s7d8f6s7d...',
    expiresAt: Date.now() - 1000 * 3600 * 2
  }
];

const MOCK_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
];

export const AuthModal: React.FC<AuthModalProps> = ({
  user,
  isOpen,
  onClose,
  onLoginSuccess,
  onUpdateUser,
  onLogout,
  onOpenFriends,
  friendsCount
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>(user ? 'account_settings' : 'landing');
  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [realFriendsCount, setRealFriendsCount] = useState<number>(friendsCount ?? 0);

  React.useEffect(() => {
    if (friendsCount !== undefined) {
      setRealFriendsCount(friendsCount);
    }
  }, [friendsCount]);

  React.useEffect(() => {
    if (user?.id && isOpen) {
      const unsub = subscribeToUserFriends(user.id, (list) => {
        setRealFriendsCount(list.length);
      });
      return () => unsub();
    }
  }, [user?.id, isOpen]);
  
  // Login / Register Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // 2FA Challenge State
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Password Recovery State
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'sms'>('email');
  const [recoveryInput, setRecoveryInput] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Onboarding Form State
  const [onboardDisplayName, setOnboardDisplayName] = useState('');
  const [onboardUsername, setOnboardUsername] = useState('');
  const [onboardAvatar, setOnboardAvatar] = useState(MOCK_AVATARS[0]);
  const [onboardBio, setOnboardBio] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  // Account Settings Subtabs
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'security' | 'sessions'>('profile');
  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);
  const [isShowLogoutConfirm, setIsShowLogoutConfirm] = useState(false);

  // Profile Edit State
  const [profileName, setProfileName] = useState(user?.displayName || '');
  const [profileUsername, setProfileUsername] = useState(user?.username || '');
  const [profileBio, setProfileBio] = useState(user?.bio || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');

  // Sửa tên Screen State
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');

  const handleOpenEditName = () => {
    const currentName = user?.displayName || 'Hoàng Nam';
    const parts = currentName.trim().split(' ');
    if (parts.length === 1) {
      setEditFirstName(parts[0]);
      setEditLastName('');
    } else {
      setEditFirstName(parts[0]);
      setEditLastName(parts.slice(1).join(' '));
    }
    setAuthMode('edit_name');
  };

  const handleSaveEditName = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullNewName = [editFirstName.trim(), editLastName.trim()].filter(Boolean).join(' ');
    if (!fullNewName) {
      showStatus('Tên không được để trống!', 'error');
      return;
    }
    const updated = { displayName: fullNewName };
    if (user?.id) {
      try {
        await syncUserProfileToFirestore({ ...user, ...updated });
      } catch (err) {
        console.warn('Lỗi lưu tên:', err);
      }
    }
    onUpdateUser(updated);
    showStatus('Cập nhật tên thành công! ✨');
    setAuthMode('account_settings');
  };

  // Spec-Kit Generator State
  const [specInputPrompt, setSpecInputPrompt] = useState('Tính năng quay clip 2s tự động ghép Daily Vlog');
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);
  const [generatedSpec, setGeneratedSpec] = useState<any | null>(null);

  const handleGenerateSpec = async () => {
    if (!specInputPrompt.trim()) return;
    setIsGeneratingSpec(true);
    try {
      const res = await fetch('/api/generate-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: specInputPrompt, category: 'feature' })
      });
      const data = await res.json();
      setGeneratedSpec(data);
      showStatus('Đã tạo Specification Spec-Kit thành công! 🛠️');
    } catch (err) {
      showStatus('Không thể tạo Spec-Kit', 'error');
    } finally {
      setIsGeneratingSpec(false);
    }
  };

  // Synchronize auth mode & state on user/modal change
  React.useEffect(() => {
    if (isOpen) {
      if (user) {
        setAuthMode('account_settings');
        setProfileName(user.displayName || '');
        setProfileUsername(user.username || '');
        setProfileBio(user.bio || '');
        setProfilePhone(user.phone || '');
      } else {
        setAuthMode('landing');
        setAuthStep('email');
      }
    }
  }, [isOpen, user]);

  // Global Status Messages
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // OTP Countdown Timer
  const triggerOtpSend = () => {
    setIsOtpSent(true);
    setOtpTimer(60);
    showStatus('Mã OTP 6 số đã được gửi!');
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Login Handler
  const handlePerformLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMethod === 'email' && (!email || !password)) {
      showStatus('Vui lòng nhập đầy đủ Email và Mật khẩu', 'error');
      return;
    }

    try {
      if (loginMethod === 'email') {
        const loggedUser = await loginWithEmailFirebase(email, password);
        if (loggedUser.is2FAEnabled) {
          setAuthMode('2fa_verify');
          showStatus('Tài khoản đã bật 2FA. Vui lòng nhập mã 6 số!');
          return;
        }
        onLoginSuccess(loggedUser);
        showStatus('Đăng nhập thành công! 🎉');
        onClose();
      } else {
        showStatus('Mã OTP 6 số đã được gửi qua SMS.');
      }
    } catch (err: any) {
      showStatus(`Lỗi đăng nhập: ${getFirebaseErrorMessage(err)}`, 'error');
    }
  };

  // 2FA Verification Handler
  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.length !== 6) {
      showStatus('Mã 2FA phải đủ 6 chữ số!', 'error');
      return;
    }
    if (user) {
      onLoginSuccess(user);
    }
    showStatus('Xác thực 2FA thành công!');
    onClose();
  };

  // OAuth Handler (Google, Apple, Facebook)
  const handleOAuthLogin = async (provider: 'Google' | 'Apple' | 'Facebook') => {
    showStatus(`Đang kết nối ${provider} OAuth...`);
    try {
      let oauthUser: UserProfile;
      if (provider === 'Google') {
        oauthUser = await loginWithGoogleFirebase();
      } else if (provider === 'Apple') {
        oauthUser = await loginWithAppleFirebase();
      } else {
        oauthUser = await loginWithFacebookFirebase();
      }
      onLoginSuccess(oauthUser);
      showStatus(`Đăng nhập thành công bằng ${provider}! 🎉`);
      onClose();
    } catch (err: any) {
      showStatus(`Lỗi đăng nhập ${provider}: ${getFirebaseErrorMessage(err)}`, 'error');
    }
  };

  // Register Handler -> Next to Onboarding
  const handlePerformRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showStatus('Vui lòng điền Email và Mật khẩu để đăng ký', 'error');
      return;
    }
    if (password.length < 6) {
      showStatus('Mật khẩu quá yếu! Mật khẩu phải từ 6 ký tự trở lên.', 'error');
      return;
    }

    try {
      const newProfile = await registerWithEmailFirebase(email, password);
      onLoginSuccess(newProfile);
      setAuthMode('onboarding');
      setOnboardDisplayName(email.split('@')[0]);
      setOnboardUsername(email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''));
      showStatus('Đăng ký tài khoản thành công! Hãy hoàn thiện thông tin Onboarding.');
    } catch (err: any) {
      showStatus(`Lỗi đăng ký: ${getFirebaseErrorMessage(err)}`, 'error');
    }
  };

  // Username Live Availability Check
  const handleCheckUsername = (val: string) => {
    setOnboardUsername(val);
    if (!val.trim()) {
      setIsUsernameAvailable(null);
      return;
    }
    setUsernameChecking(true);
    setTimeout(() => {
      setUsernameChecking(false);
      setIsUsernameAvailable(val.length >= 3 && !val.includes(' '));
    }, 400);
  };

  // Onboarding Complete Handler
  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardDisplayName || !onboardUsername) {
      showStatus('Vui lòng điền Tên hiển thị và Username!', 'error');
      return;
    }

    const updatedProfile: UserProfile = {
      id: user?.id || `u_${Date.now()}`,
      username: onboardUsername,
      displayName: onboardDisplayName,
      email: email || user?.email || 'user@setlog.app',
      phone: phone || user?.phone || '0901234567',
      avatarUrl: onboardAvatar,
      bio: onboardBio || 'Chụp khoảnh khắc thật 2s!',
      is2FAEnabled: false,
      closeFriendIds: user?.closeFriendIds || [],
      blockedUserIds: user?.blockedUserIds || [],
      qrCodeToken: `QR_${Date.now()}`,
      createdAt: Date.now()
    };

    try {
      await syncUserProfileToFirestore(updatedProfile);
      onLoginSuccess(updatedProfile);
      showStatus('Hoàn tất Onboarding & đồng bộ Firestore! 🎉');
      onClose();
    } catch (err: any) {
      showStatus(`Lỗi Onboarding: ${err?.message || err}`, 'error');
    }
  };

  // Password Recovery Request Handler
  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryInput) {
      showStatus('Vui lòng nhập Email để khôi phục mật khẩu', 'error');
      return;
    }
    try {
      await sendPasswordResetFirebase(recoveryInput);
      setRecoverySent(true);
      showStatus(`Email khôi phục mật khẩu đã được gửi đến ${recoveryInput}`);
    } catch (err: any) {
      showStatus(`Lỗi gửi khôi phục: ${err?.message || err}`, 'error');
    }
  };

  // Password Reset Save Handler
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showStatus('Mật khẩu tối thiểu 6 ký tự!', 'error');
      return;
    }
    showStatus('Đặt lại mật khẩu thành công! Hãy đăng nhập lại.');
    setAuthMode('login');
    setRecoverySent(false);
    setRecoveryInput('');
    setNewPassword('');
  };

  // Revoke Session Handler
  const handleRevokeSession = async (sessionId: string) => {
    if (user?.id) {
      await removeSessionFromFirestore(user.id, sessionId);
    }
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    showStatus('Đã huỷ phiên đăng nhập trên thiết bị từ xa.');
  };

  const handleRevokeAllRemoteSessions = async () => {
    if (user?.id) {
      for (const s of sessions) {
        if (!s.isCurrent) {
          await removeSessionFromFirestore(user.id, s.id);
        }
      }
    }
    setSessions(prev => prev.filter(s => s.isCurrent));
    showStatus('Đã đăng xuất khỏi tất cả thiết bị từ xa!');
  };

  // Profile Save
  const handleSaveProfileChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      displayName: profileName,
      username: profileUsername,
      bio: profileBio,
      phone: profilePhone
    };
    if (user?.id) {
      await syncUserProfileToFirestore({ ...user, ...updated });
    }
    onUpdateUser(updated);
    showStatus('Cập nhật hồ sơ cá nhân thành công!');
  };

  // Next step handler for Locket multi-step auth
  const isNextDisabled = () => {
    if (authStep === 'email') return !email.trim();
    if (authStep === 'password') return password.length < 6;
    if (authStep === 'phone') return !phone.trim();
    if (authStep === 'otp') return otpCode.length < 6;
    if (authStep === 'name') return !onboardDisplayName.trim();
    if (authStep === 'username') return !onboardUsername.trim();
    return false;
  };

  const handleNextStep = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isNextDisabled()) return;

    if (authMode === 'login_flow') {
      if (authStep === 'email') {
        setAuthStep('password');
      } else if (authStep === 'password') {
        handlePerformLogin(e || { preventDefault: () => {} } as any);
      } else if (authStep === 'phone') {
        triggerOtpSend();
        setAuthStep('otp');
      } else if (authStep === 'otp') {
        handlePerformLogin(e || { preventDefault: () => {} } as any);
      }
    } else if (authMode === 'register_flow') {
      if (authStep === 'name') {
        if (!onboardUsername) {
          const autoUn = onboardDisplayName.toLowerCase().replace(/[^a-z0-9_]/g, '');
          setOnboardUsername(autoUn);
        }
        setAuthStep('username');
      } else if (authStep === 'username') {
        setAuthStep('email');
      } else if (authStep === 'email') {
        setAuthStep('password');
      } else if (authStep === 'password') {
        handlePerformRegister(e || { preventDefault: () => {} } as any);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0c0c0e] border border-zinc-800/90 rounded-[36px] overflow-hidden shadow-2xl flex flex-col justify-between min-h-[580px] max-h-[92vh] p-6 relative text-white">
        
        {/* Status Toast Banner */}
        {statusMsg && (
          <div className={`p-3 text-xs font-semibold flex items-center gap-2 rounded-2xl border mb-3 ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* VIEW 1: LOCKET LANDING SCREEN (MATCHING IMAGE 1) */}
        {authMode === 'landing' && (
          <div className="flex-1 flex flex-col justify-between py-2">
            {/* Top Close Button */}
            <div className="flex justify-end">
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Phone Widget Graphic Mockup - Exactly as Image 1 */}
            <div className="relative w-48 h-56 mx-auto my-2 flex items-center justify-center">
              <div className="w-44 h-52 bg-[#121214] border-4 border-zinc-600 rounded-[32px] p-3 flex flex-col justify-between shadow-2xl shadow-amber-500/10 relative overflow-hidden">
                {/* Top Phone Screen Notch */}
                <div className="w-24 h-4 bg-[#27272a] rounded-lg mx-auto mb-2"></div>
                
                {/* Phone App Icons Grid */}
                <div className="grid grid-cols-3 gap-2 p-1 flex-1">
                  <div className="bg-zinc-700/60 rounded-xl aspect-square"></div>
                  <div className="bg-zinc-700/60 rounded-xl aspect-square"></div>
                  <div className="bg-zinc-700/60 rounded-xl aspect-square"></div>
                  <div className="bg-zinc-700/60 rounded-xl aspect-square"></div>
                  <div className="bg-zinc-700/60 rounded-xl aspect-square"></div>
                  
                  {/* Featured Locket Live Photo Widget in Grid */}
                  <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden border-2 border-[#FFCC00] shadow-lg shadow-amber-400/20">
                    <img 
                      src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=300&q=80" 
                      alt="SetLog Widget" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="bg-zinc-700/60 rounded-xl aspect-square"></div>
                  <div className="bg-zinc-700/60 rounded-xl aspect-square"></div>
                  <div className="bg-zinc-700/60 rounded-xl aspect-square"></div>
                  <div className="bg-zinc-700/60 rounded-xl aspect-square"></div>
                </div>

                {/* Bottom Dock Bar */}
                <div className="w-full h-5 bg-[#27272a] rounded-xl mx-auto mt-2"></div>
              </div>
            </div>

            {/* App Logo & Subtitle */}
            <div className="text-center space-y-2 my-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFCC00] flex items-center justify-center text-black font-extrabold text-lg shadow-md shadow-amber-400/20">
                  💛
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">SetLog</h2>
              </div>
              <p className="text-xs text-zinc-300 font-medium max-w-xs mx-auto leading-relaxed px-2">
                Ảnh trực tiếp từ bạn bè,<br />ngay trên màn hình chính
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2 mt-auto">
              <button
                type="button"
                onClick={() => { setAuthMode('register_flow'); setAuthStep('name'); }}
                className="w-full py-3.5 bg-[#FFCC00] hover:bg-[#e6b800] text-black font-extrabold rounded-full text-sm transition-all active:scale-98 shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                Tạo một tài khoản
              </button>

              <button
                type="button"
                onClick={() => { setAuthMode('login_flow'); setAuthStep('email'); }}
                className="w-full py-2 text-white hover:text-[#FFCC00] font-bold text-xs transition-colors cursor-pointer"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: STEP-BY-STEP AUTH FLOW (LOGIN / REGISTER) */}
        {(authMode === 'login_flow' || authMode === 'register_flow') && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Top Bar Navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (authStep === 'password') setAuthStep('email');
                  else if (authStep === 'otp') setAuthStep('phone');
                  else if (authStep === 'username') setAuthStep('name');
                  else if (authStep === 'email' && authMode === 'register_flow') setAuthStep('username');
                  else setAuthMode('landing');
                }}
                className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 cursor-pointer transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title Header */}
            <h2 className="text-xl sm:text-2xl font-extrabold text-white text-center py-2">
              {authMode === 'login_flow' && authStep === 'email' && 'Email của bạn là gì?'}
              {authMode === 'login_flow' && authStep === 'password' && 'Mật khẩu của bạn là gì?'}
              {authMode === 'login_flow' && authStep === 'phone' && 'Số điện thoại của bạn là gì?'}
              {authMode === 'login_flow' && authStep === 'otp' && 'Nhập mã OTP 6 số'}
              {authMode === 'register_flow' && authStep === 'name' && 'Tên của bạn là gì?'}
              {authMode === 'register_flow' && authStep === 'username' && 'Tạo biệt danh (@username)'}
              {authMode === 'register_flow' && authStep === 'email' && 'Email của bạn là gì?'}
              {authMode === 'register_flow' && authStep === 'password' && 'Tạo mật khẩu cho tài khoản'}
            </h2>

            {/* Input Form & Controls */}
            <form onSubmit={handleNextStep} className="flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {authStep === 'email' && (
                  <input
                    type="email"
                    placeholder="Địa chỉ email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1c1c1e] text-white rounded-2xl py-3.5 px-4 text-sm font-medium border border-zinc-800/80 outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] placeholder:text-zinc-500"
                    autoFocus
                  />
                )}

                {authStep === 'password' && (
                  <div className="space-y-2">
                    <input
                      type="password"
                      placeholder="Mật khẩu của bạn"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#1c1c1e] text-white rounded-2xl py-3.5 px-4 text-sm font-medium border border-zinc-800/80 outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] placeholder:text-zinc-500"
                      autoFocus
                    />
                    {authMode === 'login_flow' && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setAuthMode('forgot_password')}
                          className="text-xs text-[#FFCC00] hover:underline cursor-pointer"
                        >
                          Quên mật khẩu?
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {authStep === 'phone' && (
                  <input
                    type="text"
                    placeholder="+84 908 889 999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#1c1c1e] text-white rounded-2xl py-3.5 px-4 text-sm font-medium border border-zinc-800/80 outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] placeholder:text-zinc-500"
                    autoFocus
                  />
                )}

                {authStep === 'otp' && (
                  <div className="space-y-2">
                    <div className="text-center">
                      <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-[#FFCC00] px-2.5 py-1 rounded-full font-bold">
                        Mô phỏng OTP / Demo Mode (Nhập 123456)
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full bg-[#1c1c1e] text-white rounded-2xl py-3.5 px-4 text-base font-mono tracking-widest text-center border border-zinc-800/80 outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] placeholder:text-zinc-500"
                      autoFocus
                    />
                  </div>
                )}

                {authStep === 'name' && (
                  <input
                    type="text"
                    placeholder="Tên của bạn"
                    value={onboardDisplayName}
                    onChange={(e) => setOnboardDisplayName(e.target.value)}
                    className="w-full bg-[#1c1c1e] text-white rounded-2xl py-3.5 px-4 text-sm font-medium border border-zinc-800/80 outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] placeholder:text-zinc-500"
                    autoFocus
                  />
                )}

                {authStep === 'username' && (
                  <input
                    type="text"
                    placeholder="vivid_nam"
                    value={onboardUsername}
                    onChange={(e) => handleCheckUsername(e.target.value)}
                    className="w-full bg-[#1c1c1e] text-white rounded-2xl py-3.5 px-4 text-sm font-medium border border-zinc-800/80 outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] placeholder:text-zinc-500"
                    autoFocus
                  />
                )}

                {/* Sub-toggle option button below input */}
                {authStep === 'email' && authMode === 'login_flow' && (
                  <div className="flex flex-col items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setAuthStep('phone')}
                      className="px-5 py-2.5 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-full transition-all cursor-pointer"
                    >
                      Sử dụng số điện thoại thay cho cách này
                    </button>

                    {/* Social OAuth & Fast Test Login */}
                    <div className="w-full pt-2 space-y-2">
                      <div className="relative flex items-center justify-center py-1">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
                        <span className="relative px-3 bg-[#0c0c0e] text-[10px] font-mono text-zinc-500 uppercase">Hoặc đăng nhập nhanh</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleOAuthLogin('Google')}
                          className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Google</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOAuthLogin('Apple')}
                          className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Apple</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOAuthLogin('Facebook')}
                          className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span className="text-[#1877F2]">Facebook</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          showStatus('Đang đăng nhập bằng Tài khoản Mẫu Demo...');
                          try {
                            const demoUser = await loginWithEmailFirebase('hieusin0606@gmail.com', '12345678');
                            onLoginSuccess(demoUser);
                            showStatus('Đăng nhập thành công! 🎉');
                            onClose();
                          } catch (err) {
                            handleOAuthLogin('Google');
                          }
                        }}
                        className="w-full py-2 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-dashed border-[#FFCC00]/40 rounded-xl text-zinc-300 font-bold flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#FFCC00]" />
                        <span>Dùng thử nhanh (Tài khoản Test)</span>
                      </button>
                    </div>
                  </div>
                )}

                {authStep === 'phone' && (
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => setAuthStep('email')}
                      className="px-5 py-2.5 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-full transition-all cursor-pointer"
                    >
                      Sử dụng email thay cho cách này
                    </button>
                  </div>
                )}
              </div>

              {/* Legal disclaimer & Next Button */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] text-zinc-500 text-center px-2 leading-relaxed">
                  Thông qua việc chạm vào nút Tiếp tục, bạn đồng ý với các <span className="underline cursor-pointer">Điều khoản dịch vụ</span> và <span className="underline cursor-pointer">Chính sách quyền riêng tư</span> của chúng tôi
                </p>

                <button
                  type="submit"
                  disabled={isNextDisabled()}
                  className={`w-full py-3.5 rounded-full font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                    isNextDisabled()
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-[#FFCC00] hover:bg-[#e6b800] text-black active:scale-98 shadow-amber-500/10'
                  }`}
                >
                  <span>
                    {authStep === 'password' && authMode === 'login_flow' ? 'Đăng nhập' : ''}
                    {authStep === 'password' && authMode === 'register_flow' ? 'Tạo tài khoản' : ''}
                    {authStep !== 'password' ? 'Tiếp tục' : ''}
                  </span>
                  <span className="text-base">➔</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 3: ONBOARDING */}
        {authMode === 'onboarding' && (
          <form onSubmit={handleCompleteOnboarding} className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Thiết lập hồ sơ SetLog</h3>
              <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 font-bold mb-2">Chọn ảnh đại diện</label>
                <div className="flex items-center gap-3">
                  <img src={onboardAvatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-[#FFCC00]" />
                  <div className="flex gap-2">
                    {MOCK_AVATARS.map((url, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setOnboardAvatar(url)}
                        className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                          onboardAvatar === url ? 'border-[#FFCC00] scale-110' : 'border-zinc-800'
                        }`}
                      >
                        <img src={url} alt="Option" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Tên hiển thị</label>
                <input
                  type="text"
                  placeholder="Hoàng Nam"
                  value={onboardDisplayName}
                  onChange={(e) => setOnboardDisplayName(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-[#FFCC00]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Username</label>
                <input
                  type="text"
                  placeholder="hoang_setlog"
                  value={onboardUsername}
                  onChange={(e) => handleCheckUsername(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-[#FFCC00]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Bio ngắn</label>
                <textarea
                  rows={2}
                  placeholder="Chụp khoảnh khắc thật 2s mỗi ngày..."
                  value={onboardBio}
                  onChange={(e) => setOnboardBio(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-[#FFCC00]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#FFCC00] hover:bg-[#e6b800] text-black font-extrabold rounded-full text-xs cursor-pointer shadow-lg mt-2"
              >
                Hoàn tất Onboarding & Bắt đầu 🚀
              </button>
            </div>
          </form>
        )}

        {/* VIEW 4: FORGOT PASSWORD */}
        {authMode === 'forgot_password' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Khôi phục mật khẩu</h3>
              <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!recoverySent ? (
              <form onSubmit={handleRequestRecovery} className="space-y-3">
                <p className="text-zinc-400">Nhập Email hoặc SĐT đã đăng ký để nhận mã xác minh khôi phục mật khẩu.</p>
                
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Email hoặc SĐT</label>
                  <input
                    type="text"
                    placeholder="nam@setlog.app hoặc +84..."
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value)}
                    className="w-full bg-[#1c1c1e] border border-zinc-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFCC00]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#FFCC00] text-black font-extrabold rounded-full text-xs cursor-pointer hover:bg-[#e6b800]"
                >
                  Gửi mã khôi phục 📩
                </button>
              </form>
            ) : (
              <form onSubmit={handleSaveNewPassword} className="space-y-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Mật khẩu mới</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#1c1c1e] border border-zinc-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFCC00]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#FFCC00] text-black font-extrabold rounded-full text-xs cursor-pointer hover:bg-[#e6b800]"
                >
                  Lưu mật khẩu mới
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => { setAuthMode('login_flow'); setAuthStep('email'); }}
              className="w-full text-center text-zinc-400 hover:text-white cursor-pointer py-1"
            >
              ← Quay lại đăng nhập
            </button>
          </div>
        )}

        {/* VIEW 5: LOGGED IN LOCKET PROFILE (IMAGE 2) */}
        {authMode === 'account_settings' && user && (
          <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
            {/* Top Drag Handle & Close */}
            <div className="flex justify-between items-center relative pt-1">
              <div className="w-10 h-1 bg-zinc-700/80 rounded-full mx-auto absolute left-1/2 -translate-x-1/2" />
              <button 
                type="button" 
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer ml-auto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Centered Large Avatar & Name */}
            <div className="text-center space-y-2 pt-1">
              <div className="relative w-24 h-24 mx-auto rounded-full p-1 border-4 border-[#FFCC00] overflow-hidden shadow-2xl shadow-amber-500/20">
                <img 
                  src={user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"} 
                  alt={user.displayName} 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <h2 
                onClick={handleOpenEditName}
                className="text-xl font-extrabold text-white tracking-tight cursor-pointer hover:text-[#FFCC00] transition-colors flex items-center justify-center gap-1.5"
                title="Nhấp để sửa tên"
              >
                <span>{user.displayName || "Hoàng Nam"}</span>
                <Pencil className="w-3.5 h-3.5 text-zinc-400" />
              </h2>

              <button 
                onClick={() => {
                  navigator.clipboard?.writeText(`setlog.app/${user.username || 'duchieu1806'}`);
                  showStatus("Đã sao chép liên kết SetLog!");
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 font-medium flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <span>setlog.app/{user.username || "duchieu1806"}</span>
                <span className="text-zinc-500">🔗</span>
              </button>
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button 
                onClick={() => {
                  if (onOpenFriends) {
                    onOpenFriends();
                  }
                  onClose();
                }}
                className="py-3 px-4 bg-[#2c2c2e] hover:bg-zinc-700 rounded-2xl font-extrabold text-white text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
              >
                <Users className="w-4 h-4 text-zinc-300" />
                <span>{realFriendsCount} Bạn bè</span>
              </button>

              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'SetLog', text: 'Thêm tôi trên SetLog nhé!', url: window.location.href });
                  } else {
                    showStatus("Đã sao chép liên kết chia sẻ!");
                  }
                }}
                className="py-3 px-4 bg-[#2c2c2e] hover:bg-zinc-700 rounded-2xl font-extrabold text-white text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
              >
                <Send className="w-4 h-4 text-zinc-300" />
                <span>Chia sẻ</span>
              </button>
            </div>

            {/* SetLog Gold Promo Banner */}
            <div 
              onClick={() => showStatus("Tính năng SetLog Gold đang hoạt động! 💛")}
              className="p-3.5 bg-[#1c1c1e] border-2 border-[#FFCC00]/80 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-zinc-800/80 transition-all shadow-lg shadow-amber-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-[#FFCC00]/50 flex items-center justify-center text-[#FFCC00]">
                  💛
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs">SetLog Gold</h4>
                  <p className="text-[11px] text-zinc-400">Mở khóa các tính năng tốt nhất của SetLog</p>
                </div>
              </div>
              <span className="text-zinc-400 font-bold text-sm">›</span>
            </div>

            {/* Section: Tiện ích */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                  <span>📇</span>
                  <span>Tiện ích</span>
                </h3>
                <span className="text-[11px] font-bold text-[#FFCC00] bg-amber-500/10 px-2 py-0.5 rounded-full border border-[#FFCC00]/30">
                  Mới ➕
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Widget Card 1: Mọi người */}
                <div className="p-3 bg-[#1c1c1e] border border-zinc-800 rounded-2xl flex flex-col justify-between h-32 text-center">
                  <div className="flex items-center justify-center -space-x-2 py-1">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="f1" className="w-7 h-7 rounded-full border-2 border-black object-cover" />
                    <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80" alt="f2" className="w-7 h-7 rounded-full border-2 border-black object-cover" />
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="f3" className="w-7 h-7 rounded-full border-2 border-black object-cover" />
                  </div>
                  <span className="font-bold text-white text-xs">Mọi người</span>
                  <button 
                    onClick={() => showStatus("Chỉnh sửa tiện ích màn hình chính")}
                    className="w-full py-1.5 bg-[#2c2c2e] hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-[11px] cursor-pointer"
                  >
                    Sửa
                  </button>
                </div>

                {/* Widget Card 2: Tạo Widget */}
                <div 
                  onClick={() => showStatus("Tạo tiện ích SetLog mới!")}
                  className="p-3 bg-[#1c1c1e] border border-zinc-800 rounded-2xl flex flex-col justify-between h-32 text-center cursor-pointer hover:border-zinc-700 transition-all"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-[#FFCC00] mx-auto my-1 flex items-center justify-center text-[#FFCC00] font-extrabold text-lg shadow-md">
                    +
                  </div>
                  <span className="font-bold text-white text-xs">Tạo</span>
                  <button className="w-full py-1.5 bg-[#2c2c2e] hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-[11px] cursor-pointer">
                    Tạo
                  </button>
                </div>
              </div>
            </div>

            {/* Section: SetLog Gold Settings */}
            <div className="space-y-2 pt-2">
              <h3 className="font-extrabold text-zinc-400 text-[11px] uppercase tracking-wider">SetLog Gold</h3>
              <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl divide-y divide-zinc-800/80">
                <div 
                  onClick={() => showStatus("Đổi biểu tượng ứng dụng SetLog Gold 💛")}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-amber-400">💛</span>
                    <span className="font-bold text-white text-xs">Change app icon</span>
                  </div>
                  <span className="text-[#FFCC00] font-bold text-xs flex items-center gap-1">
                    <span>💛 Vàng</span>
                    <span className="text-zinc-500 font-normal">›</span>
                  </span>
                </div>

                <div 
                  onClick={() => showStatus("Đổi giao diện camera SetLog Gold 📷")}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-amber-400">📷</span>
                    <span className="font-bold text-white text-xs">Camera theme</span>
                  </div>
                  <span className="text-[#FFCC00] font-bold text-xs flex items-center gap-1">
                    <span>💛 Vàng</span>
                    <span className="text-zinc-500 font-normal">›</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Section: Tổng quát */}
            <div className="space-y-2 pt-1">
              <h3 className="font-extrabold text-zinc-400 text-[11px] uppercase tracking-wider">Tổng quát</h3>
              <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl divide-y divide-zinc-800/80">
                <div onClick={() => showStatus("Cài đặt Thông báo")} className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-zinc-300">🔔</span>
                    <span className="font-bold text-white text-xs">Notifications</span>
                  </div>
                  <span className="text-zinc-500 font-bold text-xs">›</span>
                </div>

                <div onClick={() => showStatus("Sửa ngày sinh")} className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-zinc-300">🎂</span>
                    <span className="font-bold text-white text-xs">Sửa ngày sinh</span>
                  </div>
                  <span className="text-zinc-500 font-bold text-xs">›</span>
                </div>

                <div onClick={handleOpenEditName} className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-zinc-300">Aa</span>
                    <span className="font-bold text-white text-xs">Sửa tên</span>
                  </div>
                  <span className="text-zinc-500 font-bold text-xs">›</span>
                </div>

                <div onClick={() => showStatus("Sửa ảnh đại diện")} className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-zinc-300">👤</span>
                    <span className="font-bold text-white text-xs">Edit profile photo</span>
                  </div>
                  <span className="text-zinc-500 font-bold text-xs">›</span>
                </div>

                <div onClick={() => showStatus("Thêm địa chỉ email")} className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-zinc-300">✉️</span>
                    <span className="font-bold text-white text-xs">Add email address</span>
                  </div>
                  <span className="text-zinc-500 font-bold text-xs">›</span>
                </div>
              </div>
            </div>

            {/* Section: Riêng tư & bảo mật */}
            <div className="space-y-2 pt-1">
              <h3 className="font-extrabold text-zinc-400 text-[11px] uppercase tracking-wider">Riêng tư & bảo mật</h3>
              <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl divide-y divide-zinc-800/80">
                <div onClick={() => showStatus("Bảo mật 2FA (Mô phỏng 2FA / Demo OTP)")} className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-zinc-300">🔐</span>
                    <span className="font-bold text-white text-xs">Xác thực 2 yếu tố (2FA)</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#FFCC00] bg-amber-500/10 px-2 py-0.5 rounded-full border border-[#FFCC00]/30">Demo Mode</span>
                </div>

                <div onClick={() => showStatus("Danh sách tài khoản đã bị chặn")} className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-zinc-300">🚫</span>
                    <span className="font-bold text-white text-xs">Tài khoản đã bị chặn</span>
                  </div>
                  <span className="text-zinc-500 font-bold text-xs">›</span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-zinc-300">💬</span>
                    <span className="font-bold text-white text-xs">Send read receipts</span>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded accent-[#FFCC00] w-4 h-4 cursor-pointer" />
                </div>

                <div onClick={() => showStatus("Quyền riêng tư & dữ liệu")} className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-zinc-300">✋</span>
                    <span className="font-bold text-white text-xs">Quyền riêng tư và dữ liệu</span>
                  </div>
                  <span className="text-zinc-500 font-bold text-xs">›</span>
                </div>
              </div>
            </div>

            {/* Section: Công cụ Dev - GitHub Spec-Kit */}
            <div className="space-y-2 pt-1">
              <h3 className="font-extrabold text-amber-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <span>🛠️</span>
                <span>Developer Tool — Spec-Kit Engine</span>
              </h3>
              <div className="bg-[#1c1c1e] border border-amber-500/20 rounded-2xl p-3 space-y-3">
                <p className="text-[11px] text-zinc-300">
                  Sinh file thiết kế quy chuẩn Specification-Driven Development cho tính năng mới:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={specInputPrompt}
                    onChange={(e) => setSpecInputPrompt(e.target.value)}
                    className="flex-1 bg-[#0c0c0e] border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#FFCC00]"
                    placeholder="Mô tả tính năng..."
                  />
                  <button
                    onClick={handleGenerateSpec}
                    disabled={isGeneratingSpec}
                    className="px-3 py-1.5 bg-[#FFCC00] text-black font-extrabold text-xs rounded-xl hover:bg-amber-400 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isGeneratingSpec ? 'Đang tạo...' : 'Tạo Spec'}
                  </button>
                </div>
                {generatedSpec && (
                  <div className="p-2.5 bg-[#0c0c0e] border border-zinc-800 rounded-xl space-y-1.5 text-left text-[11px] font-mono">
                    <div className="text-[#FFCC00] font-bold">📋 Spec ID: {generatedSpec.id}</div>
                    <div className="text-white font-bold">{generatedSpec.title}</div>
                    <div className="text-zinc-400 text-[10px] line-clamp-3">{generatedSpec.description}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Giới thiệu */}
            <div className="space-y-2 pt-1">
              <h3 className="font-extrabold text-zinc-400 text-[11px] uppercase tracking-wider">Giới thiệu</h3>
              <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl divide-y divide-zinc-800/80">
                <div onClick={() => window.open('https://tiktok.com', '_blank')} className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50">
                  <span className="font-bold text-white text-xs">TikTok</span>
                  <span className="text-zinc-500 font-bold text-xs">›</span>
                </div>
                <div onClick={() => window.open('https://instagram.com', '_blank')} className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50">
                  <span className="font-bold text-white text-xs">Instagram</span>
                  <span className="text-zinc-500 font-bold text-xs">›</span>
                </div>
                <div onClick={() => showStatus("Chia sẻ SetLog với bạn bè")} className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50">
                  <span className="font-bold text-white text-xs">Chia sẻ SetLog</span>
                  <span className="text-zinc-500 font-bold text-xs">›</span>
                </div>
                <div onClick={() => showStatus("Đánh giá SetLog 5 sao ⭐")} className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50">
                  <span className="font-bold text-white text-xs">Đánh giá SetLog</span>
                  <span className="text-zinc-500 font-bold text-xs">›</span>
                </div>
              </div>
            </div>

            {/* Section: Vùng nguy hiểm */}
            <div className="space-y-2 pt-1 pb-4">
              <h3 className="font-extrabold text-red-400 text-[11px] uppercase tracking-wider">Vùng nguy hiểm</h3>
              <div className="bg-[#1c1c1e] border border-zinc-800/90 rounded-2xl divide-y divide-zinc-800/80">
                <div 
                  onClick={() => {
                    if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản SetLog?")) {
                      onLogout();
                      showStatus("Đã xóa tài khoản.");
                    }
                  }} 
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-red-500/10"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-red-400">🗑️</span>
                    <span className="font-bold text-red-400 text-xs">Xóa tài khoản</span>
                  </div>
                  <span className="text-zinc-500 font-bold text-xs">›</span>
                </div>

                <div 
                  onClick={() => setIsShowLogoutConfirm(true)} 
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-red-500/10"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-red-400">🚪</span>
                    <span className="font-bold text-red-400 text-xs">Đăng xuất</span>
                  </div>
                  <span className="text-zinc-500 font-bold text-xs">›</span>
                </div>
              </div>
            </div>

            {/* Logout Confirmation Dialog matching Video timestamp 0:34 */}
            {isShowLogoutConfirm && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-[#2c2c2e] border border-zinc-700/80 rounded-2xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl animate-scale-up">
                  <p className="font-extrabold text-white text-sm leading-snug">
                    Bạn có chắc bạn muốn đăng xuất?
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsShowLogoutConfirm(false)}
                      className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs cursor-pointer transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsShowLogoutConfirm(false);
                        onLogout();
                        setAuthMode('landing');
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-xs cursor-pointer transition-colors border border-red-500/30"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: EDIT NAME ("Sửa tên của bạn") */}
        {authMode === 'edit_name' && (
          <div className="flex-1 overflow-y-auto text-xs pr-1 flex flex-col justify-between py-2 min-h-[420px]">
            <div>
              {/* Top Drag Handle & Back Button */}
              <div className="flex justify-between items-center relative pt-1 mb-8">
                <button 
                  type="button" 
                  onClick={() => setAuthMode('account_settings')} 
                  className="w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-1 bg-zinc-700/80 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-1" />
              </div>

              <h2 className="text-2xl font-extrabold text-white text-center mb-8 tracking-tight">
                Sửa tên của bạn
              </h2>

              <form id="edit-name-form" onSubmit={handleSaveEditName} className="space-y-3.5 max-w-xs mx-auto">
                <div>
                  <input
                    type="text"
                    placeholder="Họ / Tên đệm"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full bg-[#2c2c2e] text-white text-lg font-semibold px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFCC00]/50 placeholder-zinc-500 border border-transparent transition-all"
                    autoFocus
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Tên"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full bg-[#2c2c2e] text-white text-lg font-semibold px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFCC00]/50 placeholder-zinc-500 border border-transparent transition-all"
                  />
                </div>
              </form>
            </div>

            <div className="pt-8 pb-2 max-w-xs mx-auto w-full">
              <button
                form="edit-name-form"
                type="submit"
                className="w-full py-4 bg-[#FFCC00] hover:bg-[#e6b800] text-black font-extrabold rounded-3xl text-base cursor-pointer active:scale-95 transition-all shadow-lg shadow-amber-500/20"
              >
                Lưu
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
