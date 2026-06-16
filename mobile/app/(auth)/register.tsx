import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { authApi } from '../../src/services/auth.api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) return Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ');
    setLoading(true);
    try {
      await authApi.register(name, email, password);
      Alert.alert('Thành công', 'Đăng ký thành công!', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng ký</Text>
      <TextInput style={styles.input} placeholder="Họ tên" placeholderTextColor="#666"
        value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666"
        value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Mật khẩu" placeholderTextColor="#666"
        value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Đang đăng ký...' : 'Đăng ký'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0f0f1a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 32 },
  input: { backgroundColor: '#1e1e2e', color: '#fff', padding: 16, borderRadius: 10, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#6C63FF', textAlign: 'center', marginTop: 20, fontSize: 15 },
});