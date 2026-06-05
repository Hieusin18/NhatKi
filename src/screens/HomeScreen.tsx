import React from 'react';
import { SafeAreaView, View, Text, FlatList, StyleSheet } from 'react-native';
import DiaryCard, { DiaryEntry } from '../components/DiaryCard';

// Dữ liệu mẫu ban đầu để kiểm thử hiển thị Feed UI
const MOCK_DATA: DiaryEntry[] = [
  {
    id: '1',
    title: 'Một ngày làm KOC bận rộn',
    content:
      'Hôm nay nhận được hộp quà siêu xinh từ thương hiệu gửi tặng. Quay một chiếc video unboxing thật xịn sò đăng TikTok thôiiii!',
    createdAt: '04/06/2026',
    mood: '🤩',
    location: 'Lotte Mall West Lake, Hà Nội',
    isPublic: true,
  },
  {
    id: '2',
    title: 'Ngồi code đồ án muốn nổ não',
    content:
      'Vừa hoàn thiện xong con Emoji Picker dùng thư viện ngoài và căn chỉnh cái trục dọc Timeline mượt mà. Đẹp xuất sắc luôn!',
    createdAt: '03/06/2026',
    mood: '😎',
    location: 'Trường Đại học CMC',
    isPublic: false,
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Personal Memory Timeline</Text>
      </View>

      <FlatList
        data={MOCK_DATA}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <DiaryCard item={item} isLast={index === MOCK_DATA.length - 1} />
        )}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#2c2c2c',
    alignItems: 'center',
  },
  headerTitle: { color: '#bb86fc', fontSize: 18, fontWeight: 'bold' },
  listContainer: { paddingVertical: 16 },
});
