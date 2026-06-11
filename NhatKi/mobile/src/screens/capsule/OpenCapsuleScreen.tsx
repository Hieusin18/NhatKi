import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function OpenCapsuleScreen() {
  const { id, title, canOpen } = useLocalSearchParams<{ id: string; title: string; canOpen: string }>();
  const [opened, setOpened] = useState(false);
  const [scale] = useState(new Animated.Value(1));

  const handleOpen = () => {
    if (canOpen !== '1') {
      alert('🔒 Chưa đến ngày mở hộp này!');
      return;
    }
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 300, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.9, duration: 200, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.1, duration: 200, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => setOpened(true));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.body}>
        {!opened ? (
          <>
            <Animated.View style={[styles.boxWrapper, { transform: [{ scale }] }]}>
              <Text style={styles.boxIcon}>{canOpen === '1' ? '📦' : '🔒'}</Text>
            </Animated.View>
            <Text style={styles.boxTitle}>
              {canOpen === '1' ? 'Hộp đã sẵn sàng để mở!' : 'Hộp đang bị khoá'}
            </Text>
            <Text style={styles.boxSub}>
              {canOpen === '1' ? 'Nhấn để mở hộp kỷ niệm 🎉' : 'Chưa đến ngày mở hộp này'}
            </Text>
            <TouchableOpacity
              style={[styles.openBtn, canOpen !== '1' && styles.openBtnDisabled]}
              onPress={handleOpen}>
              <Text style={styles.openTxt}>
                {canOpen === '1' ? '🎁 Mở hộp!' : '🔒 Chưa thể mở'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.openedIcon}>🎉</Text>
            <Text style={styles.openedTitle}>Hộp đã được mở!</Text>
            <Text style={styles.openedSub}>Những kỷ niệm đẹp của bạn</Text>
            <View style={styles.mockImages}>
              {['📸', '🌅', '👥', '😊', '🎊'].map((emoji, i) => (
                <View key={i} style={styles.mockImg}>
                  <Text style={styles.mockEmoji}>{emoji}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
              <Text style={styles.doneTxt}>Đóng lại</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56 },
  back: { color: '#6C63FF', fontSize: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  boxWrapper: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#1e1e2e', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  boxIcon: { fontSize: 64 },
  boxTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  boxSub: { fontSize: 15, color: '#888', textAlign: 'center' },
  openBtn: { backgroundColor: '#6C63FF', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 12, marginTop: 16 },
  openBtnDisabled: { backgroundColor: '#2a2a3e' },
  openTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },
  openedIcon: { fontSize: 80 },
  openedTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  openedSub: { fontSize: 15, color: '#888' },
  mockImages: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 16 },
  mockImg: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#1e1e2e', justifyContent: 'center', alignItems: 'center' },
  mockEmoji: { fontSize: 36 },
  doneBtn: { backgroundColor: '#1e1e2e', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12, marginTop: 16 },
  doneTxt: { color: '#aaa', fontSize: 16 },
});