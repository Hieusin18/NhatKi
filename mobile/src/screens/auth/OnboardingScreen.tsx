import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>NhatKi 📓</Text>
      <Text style={styles.subtitle}>Your life, organized.{'\n'}Your memories, preserved.</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.buttonText}>Bắt đầu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f1a', padding: 24 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  subtitle: { fontSize: 18, color: '#aaa', textAlign: 'center', marginBottom: 48, lineHeight: 28 },
  button: { backgroundColor: '#6C63FF', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});