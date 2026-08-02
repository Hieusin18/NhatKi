import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import { useApp } from '../context/AppContext';

const AVATAR_OPTIONS = ['😎', '⚡', '🔥', '🚀', '💫', '🎨', '🐱', '🦊', '🦁', '🐻'];

export const AuthScreen: React.FC = () => {
  const { login, register, loginWithGoogle } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('😎');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu!');
      return;
    }
    if (isRegister && !displayName.trim()) {
      setErrorMsg('Vui lòng nhập tên hiển thị!');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email.trim(), password, displayName.trim(), selectedAvatar);
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err?.message || 'Thao tác thất bại';
      if (msg.includes('auth/user-not-found') || msg.includes('auth/invalid-credential')) {
        msg = 'Email hoặc mật khẩu không chính xác!';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'Email này đã được đăng ký tài khoản!';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Mật khẩu phải chứa ít nhất 6 ký tự!';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0c0c0e" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* APP BRANDING HEADER */}
        <View style={styles.brandingBox}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>2S VLOG</Text>
          </View>
          <Text style={styles.brandTitle}>SetLog</Text>
          <Text style={styles.brandTagline}>Khoảnh khoảnh 2s Daily Vlog cùng bạn bè</Text>
        </View>

        {/* FORM CARD */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>
            {isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập'}
          </Text>

          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          )}

          {isRegister && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>TÊN HIỂN THỊ</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: Hoàng Phạm"
                  placeholderTextColor="#52525b"
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CHỌN AVATAR EMOJI</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarRow}>
                  {AVATAR_OPTIONS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.avatarChip,
                        selectedAvatar === emoji && styles.avatarChipActive
                      ]}
                      onPress={() => setSelectedAvatar(emoji)}
                    >
                      <Text style={styles.avatarEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#52525b"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>MẬT KHẨU</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#52525b"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading || googleLoading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isRegister ? 'TẠO TÀI KHOẢN' : 'ĐĂNG NHẬP'}
              </Text>
            )}
          </TouchableOpacity>

          {/* DIVIDER */}
          <View style={styles.dividerBox}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* GOOGLE SIGN IN BUTTON */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={async () => {
              setErrorMsg(null);
              setGoogleLoading(true);
              try {
                await loginWithGoogle();
              } catch (err: any) {
                console.error('Google Sign In error:', err);
                setErrorMsg(err?.message || 'Không thể đăng nhập bằng Google.');
              } finally {
                setGoogleLoading(false);
              }
            }}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleBtnText}>ĐĂNG NHẬP BẰNG GOOGLE</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
            }}
          >
            <Text style={styles.switchBtnText}>
              {isRegister
                ? 'Đã có tài khoản? Đăng nhập ngay'
                : 'Chưa có tài khoản? Đăng ký mới'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0e'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center'
  },
  brandingBox: {
    alignItems: 'center',
    marginBottom: 28
  },
  logoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,42,122,0.15)',
    borderColor: '#ff2a7a',
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 8
  },
  logoBadgeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#ff2a7a',
    letterSpacing: 1.5
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1
  },
  brandTagline: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 4
  },
  card: {
    backgroundColor: '#111115',
    borderColor: '#1f1f23',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 16
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 12
  },
  errorText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '600'
  },
  inputGroup: {
    gap: 6
  },
  label: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#71717a',
    letterSpacing: 1
  },
  input: {
    backgroundColor: '#0c0c0e',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14
  },
  avatarRow: {
    flexDirection: 'row',
    marginTop: 4
  },
  avatarChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0c0c0e',
    borderColor: '#27272a',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  avatarChipActive: {
    borderColor: '#c8ff00',
    backgroundColor: 'rgba(200,255,0,0.1)'
  },
  avatarEmoji: {
    fontSize: 18
  },
  submitBtn: {
    backgroundColor: '#c8ff00',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  submitBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1
  },
  dividerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#27272a'
  },
  dividerText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#71717a',
    paddingHorizontal: 10,
    fontWeight: 'bold'
  },
  googleBtn: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4285F4'
  },
  googleBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5
  },
  switchBtn: {
    alignItems: 'center',
    paddingVertical: 6
  },
  switchBtnText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600'
  }
});
