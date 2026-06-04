import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { router } from 'expo-router';

// Mock data - khi backend xong thì thay bằng API call
const MOCK_FEED = [
  { id: '1', user: 'Dev 1', avatar: '👨‍💻', image: null, caption: 'Setup DB xong rồi 🎉', time: '2 phút trước', mode: 'group' },
  { id: '2', user: 'Dev 4', avatar: '🎨', image: null, caption: 'Figma wireframe hoàn thiện!', time: '15 phút trước', mode: 'group' },
  { id: '3', user: 'Bạn', avatar: '📱', image: null, caption: 'Camera đang test...', time: '1 giờ trước', mode: 'solo' },
];

export default function Home() {
  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.avatar}>{item.avatar}</Text>
        <View>
          <Text style={styles.username}>{item.user}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={[styles.modeBadge, item.mode === 'group' ? styles.groupBadge : styles.soloBadge]}>
          <Text style={styles.modeTxt}>{item.mode === 'group' ? '👥 Nhóm' : '👤 Solo'}</Text>
        </View>
      </View>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderTxt}>📷 Ảnh mock</Text>
      </View>
      <Text style={styles.caption}>{item.caption}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>NhatKi 📓</Text>
        <TouchableOpacity style={styles.cameraBtn} onPress={() => router.push('/(main)/camera')}>
          <Text style={styles.cameraTxt}>📷</Text>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <FlatList
        data={MOCK_FEED}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: '#0f0f1a' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  cameraBtn: { backgroundColor: '#6C63FF', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  cameraTxt: { fontSize: 20 },
  feed: { padding: 16, gap: 16 },
  card: { backgroundColor: '#1e1e2e', borderRadius: 16, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  avatar: { fontSize: 32 },
  username: { color: '#fff', fontWeight: '600', fontSize: 15 },
  time: { color: '#666', fontSize: 12 },
  modeBadge: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  groupBadge: { backgroundColor: 'rgba(108,99,255,0.2)' },
  soloBadge: { backgroundColor: 'rgba(74,222,128,0.2)' },
  modeTxt: { fontSize: 12, color: '#fff' },
  imagePlaceholder: { height: 200, backgroundColor: '#2a2a3e', justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderTxt: { color: '#444', fontSize: 16 },
  caption: { color: '#ccc', padding: 12, fontSize: 14 },
});