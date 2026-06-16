import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

const FRIENDS = [
  { id: '1', name: 'Minh', emoji: '😊', color: '#FFD6E8' },
  { id: '2', name: 'Chi', emoji: '🤩', color: '#FFD6E8' },
  { id: '3', name: 'Hiền', emoji: '😌', color: '#FFD6E8' },
  { id: '4', name: 'Tâm', emoji: '😛', color: '#FFD6E8' },
];

const FEED = [
  {
    id: '1', user: 'Minh Tâm', emoji: '😊', color: '#FFD6E8',
    time: '2 giờ trước', isPublic: true,
    caption: 'Hôm nay đi cafe với bạn bè và ăn bánh ngọt! Ngon quá 💕',
    likes: 24, comments: 12, stars: 8,
  },
  {
    id: '2', user: 'Chi Linh', emoji: '🤩', color: '#E8D6FF',
    time: '4 giờ trước', isPublic: false,
    caption: 'Buổi chiều thật bình yên ☁️ Nghe nhạc và đọc sách',
    likes: 18, comments: 6, stars: 14,
  },
];

export default function Home() {
  const renderFriend = ({ item }: any) => (
    <TouchableOpacity style={styles.friendItem}>
      <View style={[styles.friendAvatar, { backgroundColor: item.color }]}>
        <Text style={styles.friendEmoji}>{item.emoji}</Text>
        <View style={styles.friendOnline} />
      </View>
      <Text style={styles.friendName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderPost = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.postAvatar, { backgroundColor: item.color }]}>
          <Text style={styles.postAvatarEmoji}>{item.emoji}</Text>
        </View>
        <View style={styles.postMeta}>
          <Text style={styles.postUser}>{item.user}</Text>
          <Text style={styles.postTime}>{item.time}</Text>
        </View>
        <View style={[styles.badge, item.isPublic ? styles.badgePublic : styles.badgePrivate]}>
          <Text style={styles.badgeIcon}>{item.isPublic ? '🌐' : '🔒'}</Text>
          <Text style={styles.badgeText}>{item.isPublic ? 'Public' : 'Riêng tư'}</Text>
        </View>
      </View>

      <View style={styles.postImage}>
        <Text style={styles.postImagePlaceholder}>📷</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.caption}>{item.caption}</Text>
        <View style={styles.reactions}>
          <TouchableOpacity style={styles.reaction}>
            <Text style={styles.reactionIcon}>❤️</Text>
            <Text style={styles.reactionCount}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reaction}>
            <Text style={styles.reactionIcon}>🔥</Text>
            <Text style={styles.reactionCount}>{item.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reaction}>
            <Text style={styles.reactionIcon}>✨</Text>
            <Text style={styles.reactionCount}>{item.stars}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header cố định */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Text style={styles.headerIcon}>👤</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>SETLOG</Text>
          <Text style={styles.headerSub}>Chia sẻ cuộc sống với bạn bè và lưu thành nhật ký</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/group-setting')}>
          <Text style={styles.headerIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Friend avatars cố định */}
      <View style={styles.friendsSection}>
        <FlatList
          data={FRIENDS}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.friendsList}
        />
      </View>

      {/* Feed scroll */}
      <FlatList
        data={FEED}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feed}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F7' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#FFE4EE',
  },
  headerIcon: { fontSize: 22, width: 36, textAlign: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FF69B4', letterSpacing: 2 },
  headerSub: { fontSize: 10, color: '#CC7BAA', textAlign: 'center', marginTop: 1 },

  friendsSection: {
    backgroundColor: '#fff', marginBottom: 12,
    paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#FFE4EE',
  },
  friendsList: { paddingHorizontal: 16, gap: 20 },
  friendItem: { alignItems: 'center', gap: 6 },
  friendAvatar: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#FF69B4',
  },
  friendEmoji: { fontSize: 28 },
  friendOnline: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#4ADE80', borderWidth: 2, borderColor: '#fff',
  },
  friendName: { fontSize: 12, color: '#555', fontWeight: '500' },

  feed: { padding: 12, gap: 12, paddingBottom: 20 },

  card: {
    backgroundColor: '#fff', borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF69B4', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 10,
  },
  postAvatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFB6C1',
  },
  postAvatarEmoji: { fontSize: 22 },
  postMeta: { flex: 1 },
  postUser: { fontSize: 15, fontWeight: '700', color: '#FF69B4' },
  postTime: { fontSize: 12, color: '#aaa', marginTop: 1 },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  badgePublic: { backgroundColor: '#E8F8F0' },
  badgePrivate: { backgroundColor: '#F0E8FF' },
  badgeIcon: { fontSize: 12 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#0F6E56' },

  postImage: {
    height: 220, backgroundColor: '#FFF0F7',
    justifyContent: 'center', alignItems: 'center',
  },
  postImagePlaceholder: { fontSize: 48 },

  cardFooter: { padding: 14 },
  caption: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 12 },

  reactions: { flexDirection: 'row', gap: 20 },
  reaction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reactionIcon: { fontSize: 18 },
  reactionCount: { fontSize: 14, color: '#888', fontWeight: '600' },
});
