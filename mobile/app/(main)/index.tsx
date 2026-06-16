import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

const MOCK_FEED = [
  { id: '1', user: 'Dev 1', initials: 'D1', color: '#1D9E75', caption: 'Setup DB xong rồi 🎉', time: '2 phút trước', mode: 'group' },
  { id: '2', user: 'Dev 4', initials: 'D4', color: '#D85A30', caption: 'Figma wireframe hoàn thiện!', time: '15 phút trước', mode: 'group' },
  { id: '3', user: 'Bạn', initials: 'BN', color: '#378ADD', caption: 'Camera đang test...', time: '1 giờ trước', mode: 'solo' },
];

export default function Home() {
  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: item.color }]}>
          <Text style={styles.avatarText}>{item.initials}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.username}>{item.user}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={[styles.badge, item.mode === 'group' ? styles.badgeGroup : styles.badgeSolo]}>
          <Text style={[styles.badgeText, item.mode === 'group' ? styles.badgeTextGroup : styles.badgeTextSolo]}>
            {item.mode === 'group' ? 'Nhóm' : 'Cá nhân'}
          </Text>
        </View>
      </View>

      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderIcon}>📷</Text>
        <Text style={styles.imagePlaceholderText}>Chưa có ảnh</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.caption}>{item.caption}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào 👋</Text>
          <Text style={styles.title}>NhatKi</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(main)/capsule')}>
            <Text style={styles.iconBtnText}>⏳</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/profile')}>
            <Text style={styles.iconBtnText}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={MOCK_FEED}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dòng thời gian</Text>
            <TouchableOpacity onPress={() => router.push('/group-setting')}>
              <Text style={styles.sectionLink}>Nhóm của tôi</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(main)/camera')}>
        <Text style={styles.fabText}>📷</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  greeting: { fontSize: 13, color: '#888', marginBottom: 2 },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#f5f6fa',
    borderWidth: 1, borderColor: '#e8e8e8',
    justifyContent: 'center', alignItems: 'center',
  },
  iconBtnText: { fontSize: 18 },

  feed: { padding: 16, gap: 12, paddingBottom: 100 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  sectionLink: { fontSize: 13, color: '#1D9E75', fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#f0f0f0',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 10,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cardMeta: { flex: 1 },
  username: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  time: { fontSize: 12, color: '#aaa', marginTop: 1 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeGroup: { backgroundColor: '#e8f7f2' },
  badgeSolo: { backgroundColor: '#e8f0fb' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextGroup: { color: '#0F6E56' },
  badgeTextSolo: { color: '#185FA5' },

  imagePlaceholder: {
    height: 180, backgroundColor: '#f5f6fa',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  imagePlaceholderIcon: { fontSize: 32 },
  imagePlaceholderText: { fontSize: 13, color: '#bbb' },

  cardFooter: { padding: 14, paddingTop: 10 },
  caption: { fontSize: 14, color: '#333', lineHeight: 20 },

  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#1D9E75',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1D9E75', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { fontSize: 26 },
});
