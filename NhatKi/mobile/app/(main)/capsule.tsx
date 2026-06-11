import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

// Mock store tạm - dùng biến ngoài để giữ state giữa các màn
export const capsuleStore: any[] = [
  { id: '1', title: 'Kỷ niệm nhóm tháng 6', openDate: '2026-12-31', isLocked: true, images: 3 },
  { id: '2', title: 'Ngày đầu tiên', openDate: '2026-06-04', isLocked: false, images: 5 },
  { id: '3', title: 'Mục tiêu 2027', openDate: '2027-01-01', isLocked: true, images: 1 },
];

function getCountdown(dateStr: string) {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours };
}

export default function Capsule() {
  const [capsules, setCapsules] = useState([...capsuleStore]);

  useFocusEffect(
    useCallback(() => {
      setCapsules([...capsuleStore]);
    }, [])
  );

  const renderItem = ({ item }: any) => {
    const countdown = getCountdown(item.openDate);
    const canOpen = !countdown;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: '/(main)/capsule-detail', params: { id: item.id, title: item.title, canOpen: canOpen ? '1' : '0' } })}>
        <View style={styles.cardLeft}>
          <Text style={styles.capsuleIcon}>{item.isLocked ? '🔒' : '📦'}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSub}>📷 {item.images} ảnh</Text>
          {countdown ? (
            <Text style={styles.countdown}>⏳ Còn {countdown.days} ngày {countdown.hours} giờ</Text>
          ) : (
            <Text style={styles.canOpen}>🎉 Có thể mở rồi!</Text>
          )}
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Time Capsule ⏳</Text>
        <TouchableOpacity onPress={() => router.push('/(main)/capsule-create')}>
          <Text style={styles.addBtn}>+ Tạo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={capsules}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56 },
  back: { color: '#6C63FF', fontSize: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  addBtn: { color: '#6C63FF', fontSize: 16, fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#1e1e2e', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardLeft: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2a2a3e', justifyContent: 'center', alignItems: 'center' },
  capsuleIcon: { fontSize: 24 },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cardSub: { color: '#666', fontSize: 13 },
  countdown: { color: '#f59e0b', fontSize: 13, fontWeight: '500' },
  canOpen: { color: '#4ade80', fontSize: 13, fontWeight: '600' },
  arrow: { color: '#444', fontSize: 24 },
});