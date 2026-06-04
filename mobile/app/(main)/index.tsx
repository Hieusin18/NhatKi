import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function Home() {
  const logout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NhatKi 📓</Text>
      <Text style={styles.subtitle}>🎉 Đăng nhập thành công!</Text>
      <Text style={styles.note}>Home screen — Tuần 2 sẽ build tiếp</Text>
      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f1a', padding: 24 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  subtitle: { fontSize: 20, color: '#6C63FF', marginBottom: 8 },
  note: { fontSize: 14, color: '#888', marginBottom: 48 },
  button: { backgroundColor: '#1e1e2e', padding: 16, borderRadius: 10, paddingHorizontal: 32 },
  buttonText: { color: '#ff6b6b', fontSize: 16, fontWeight: '600' },
});