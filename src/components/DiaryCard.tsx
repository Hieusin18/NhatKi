import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Định nghĩa kiểu dữ liệu cho 1 bài viết nhật ký
export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  mood: string;
  location: string | null;
  isPublic: boolean;
}

interface DiaryCardProps {
  item: DiaryEntry;
  isLast: boolean;
}

export default function DiaryCard({ item, isLast }: DiaryCardProps) {
  return (
    <View style={styles.container}>
      {/* Trục dọc Timeline bên trái */}
      <View style={styles.timelineLeft}>
        <View style={styles.timelineDot}>
          <Text style={styles.dotEmoji}>{item.mood || '📝'}</Text>
        </View>
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Nội dung Card bên phải */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{item.createdAt}</Text>
          <Text style={styles.privacyText}>
            {item.isPublic ? '🌐 Public' : '🔒 Private'}
          </Text>
        </View>

        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.bodyText} numberOfLines={3}>
          {item.content}
        </Text>

        {/* Tag Địa điểm Mockup */}
        {item.location && (
          <View style={styles.locationTag}>
            <Text style={styles.locationText}>📍 {item.location}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', minHeight: 100 },
  timelineLeft: { width: 50, alignItems: 'center' },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2c2c2c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bb86fc',
    zIndex: 1,
  },
  dotEmoji: { fontSize: 18 },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#333',
    marginVertical: 4,
  },
  cardContent: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    marginRight: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dateText: { color: '#aaa', fontSize: 12 },
  privacyText: { color: '#03dac6', fontSize: 11, fontWeight: '600' },
  titleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  bodyText: { color: '#ddd', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  locationTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(187, 134, 252, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  locationText: { color: '#bb86fc', fontSize: 12, fontWeight: '500' },
});
