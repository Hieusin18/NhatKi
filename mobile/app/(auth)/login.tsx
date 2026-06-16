import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { authApi } from '../../src/services/auth.api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ');
      return;
    }
    setLoading(true);
    try {
      await authApi.login(email, password);
      router.replace('/(main)/index');
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.logoBox}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>📓</Text>
          </View>
          <Text style={styles.appName}>NhatKi</Text>
          <Text style={styles.tagline}>Ký ức của bạn, mãi mãi</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Đăng nhập</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              placeholderTextColor="#bbb"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#bbb"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkRow}>
          <Text style={styles.linkText}>Chưa có tài khoản? </Text>
          <Text style={styles.linkBold}>Đăng ký ngay</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  logoBox: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#1D9E75',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1D9E75', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: '#888', marginTop: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 20 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    backgroundColor: '#f5f6fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
  },

  button: {
    backgroundColor: '#1D9E75',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  linkText: { fontSize: 14, color: '#888' },
  linkBold: { fontSize: 14, color: '#1D9E75', fontWeight: '700' },
});
