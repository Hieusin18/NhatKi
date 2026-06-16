import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

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
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/(main)/capsule-detail', params: { id: item.id, title: item.title, canOpen: canOpen ? '1' : '0' } })}
      >
        <View style={[styles.cardIcon, canOpen ? styles.cardIconOpen : styles.cardIconLocked]}>
          <Text style={styles.cardEmoji}>{canOpen ? '🎁' : '🔒'}</Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.metaIcon}>📷</Text>
            <Text style={styles.metaText}>{item.images} ảnh</Text>
          </View>
          {countdown ? (
            <View style={styles.countdownBox}>
              <Text style={styles.countdownText}>⏳ Còn {countdown.days} ngày {countdown.hours} giờ</Text>
            </View>
          ) : (
            <View style={styles.openBox}>
              <Text style={styles.openText}>🎉 Có thể mở rồi!</Text>
            </View>
          )}
        </View>

        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Time Capsule ⏳</Text>
          <Text style={styles.subtitle}>Lưu giữ kỷ niệm cho tương lai</Text>
        </View>
        <View style={styles.headerSide}>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(main)/capsule-create')}>
            <Text style={styles.addIcon}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{capsules.filter(c => getCountdown(c.openDate)).length}</Text>
          <Text style={styles.statLabel}>Đang khóa</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{capsules.filter(c => !getCountdown(c.openDate)).length}</Text>
          <Text style={styles.statLabel}>Có thể mở</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{capsules.length}</Text>
          <Text style={styles.statLabel}>Tổng cộng</Text>
        </View>
      </View>

      <FlatList
        data={capsules}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F7' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4EE',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSide: { width: 38, alignItems: 'flex-end' },
  title: { fontSize: 20, fontWeight: '800', color: '#FF69B4', letterSpacing: 0.5 },
  subtitle: { fontSize: 11, color: '#CC7BAA', marginTop: 2 },

  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#FF69B4',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF69B4', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  addIcon: { color: '#fff', fontSize: 22, fontWeight: '300', lineHeight: 24 },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#FFE4EE',
  },
  statNum: { fontSize: 22, fontWeight: '800', color: '#FF69B4' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },

  list: { padding: 16, gap: 12, paddingBottom: 30 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#FF69B4', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardIcon: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  cardIconLocked: { backgroundColor: '#FFE4EE' },
  cardIconOpen: { backgroundColor: '#E8F8F0' },
  cardEmoji: { fontSize: 26 },

  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaIcon: { fontSize: 12 },
  metaText: { fontSize: 12, color: '#888' },

  countdownBox: {
    backgroundColor: '#FFF8E8',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  countdownText: { fontSize: 12, color: '#BA7517', fontWeight: '600' },

  openBox: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  openText: { fontSize: 12, color: '#0F6E56', fontWeight: '700' },

  arrow: { fontSize: 24, color: '#FFB6C1', fontWeight: '300' },
});
