import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useFeed } from "../../hooks/useFeed";
import { ReactionSheet } from "./ReactionSheet";
import { feedApi } from "../../services/feed.api";

export const FeedScreen: React.FC = () => {
  const { feeds, isLoading, refreshFeeds, loadMoreFeeds } = useFeed();
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);

  const handleReact = async (emoji: string) => {
    if (!selectedFeedId) return;
    try {
      await feedApi.sendReaction(selectedFeedId, emoji);
      refreshFeeds(); // Tải lại danh sách sau khi tương tác thành công để cập nhật số lượt thích
    } catch (error) {
      console.error("Không thể thực hiện tương tác bài viết:", error);
    } finally {
      setSelectedFeedId(null);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={feeds}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        onRefresh={refreshFeeds} // Kéo xuống từ đỉnh màn hình để reload bài mới
        onEndReached={loadMoreFeeds} // Cuộn xuống đáy để tự động nạp thêm bài cũ
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoading ? <ActivityIndicator style={{ margin: 16 }} /> : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Header thông tin người đăng */}
            <View style={styles.header}>
              <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
              <View style={styles.headerText}>
                <Text style={styles.username}>{item.user.name}</Text>
                <Text style={styles.time}>{item.createdAt}</Text>
              </View>
            </View>

            {/* Khối hiển thị hình ảnh nhật ký */}
            <Image source={{ uri: item.imageUrl }} style={styles.postImage} />

            {/* Khối hiển thị các nhãn trạng thái gắn kèm */}
            <View style={styles.tagContainer}>
              {item.emotion && (
                <View style={[styles.tag, { backgroundColor: "#FAEEDA" }]}>
                  <Text style={styles.tagText}>Cảm xúc: {item.emotion}</Text>
                </View>
              )}
              {item.location && (
                <View style={[styles.tag, { backgroundColor: "#E6F1FB" }]}>
                  <Text style={styles.tagText}>📍 {item.location}</Text>
                </View>
              )}
            </View>

            {/* Thanh tương tác chức năng */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setSelectedFeedId(item.id)}
              >
                <Text style={styles.actionText}>
                  ❤️ {item.reactionsCount} Thích
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>
                  💬 {item.commentsCount} Bình luận
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Cửa sổ Bottom Sheet thả emoji cảm xúc nhanh */}
      <ReactionSheet
        isVisible={selectedFeedId !== null}
        onClose={() => setSelectedFeedId(null)}
        onSelectReaction={handleReact}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  card: {
    backgroundColor: "#fff",
    marginVertical: 6,
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 12,
    elevation: 1,
  },
  header: { flexDirection: "row", alignItems: "center", padding: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  headerText: { marginLeft: 10 },
  username: { fontSize: 14, fontWeight: "600", color: "#333" },
  time: { fontSize: 11, color: "#888", marginTop: 2 },
  postImage: { width: "100%", height: 280, resizeMode: "cover" },
  tagContainer: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    flexWrap: "wrap",
  },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 12, fontWeight: "500" },
  actionRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderColor: "#eee",
    marginTop: 10,
    paddingVertical: 10,
  },
  actionButton: { flex: 1, alignItems: "center", justifyContent: "center" },
  actionText: { fontSize: 13, fontWeight: "500", color: "#555" },
});
