import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import MoodPicker from '../components/MoodPicker';

interface CreateDiaryScreenProps {
  navigation: any; // Hoặc kiểu dữ liệu Navigation chuẩn của bạn
}

export default function CreateDiaryScreen({
  navigation,
}: CreateDiaryScreenProps) {
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('😊');
  const [location, setLocation] = useState<string>('');

  const handleSave = () => {
    if (!title || !content) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const newDiary = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: 'Hôm nay',
      mood: selectedMood,
      location: location || null,
      isPublic: false,
    };

    // Tạm thời log ra để test UI hoạt động đúng dữ liệu
    console.log('Đã tạo nhật ký thành công:', newDiary);

    // Sau này tích hợp Store (Zustand/Redux) hoặc API ở đây để đẩy về HomeScreen
    Alert.alert('Thành công', 'Đã ghi lại kỷ niệm mới!', [
      {
        text: 'OK',
        onPress: () => (navigation.goAsync ? navigation.goBack() : null),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Viết kỷ niệm mới</Text>

      <TextInput
        placeholder="Tiêu đề nhật ký..."
        placeholderTextColor="#666"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        placeholder="Hôm nay có điều gì đáng nhớ không?..."
        placeholderTextColor="#666"
        style={[styles.input, styles.textArea]}
        multiline
        value={content}
        onChangeText={setContent}
      />

      {/* Tích hợp Component MoodPicker dùng thư viện ngoài */}
      <MoodPicker selectedMood={selectedMood} onSelectMood={setSelectedMood} />

      {/* UI Tag Địa điểm (Map Picker Mockup gõ tay) */}
      <TextInput
        placeholder="📍 Thêm vị trí (Ví dụ: Hà Đông, Hà Nội...)"
        placeholderTextColor="#666"
        style={styles.input}
        value={location}
        onChangeText={setLocation}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Lưu vào Dòng thời gian</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2c2c2c',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#bb86fc',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: { color: '#121212', fontWeight: 'bold', fontSize: 16 },
});
// 1. Thêm dòng import này ở đầu file CreateDiaryScreen.tsx
import LocationPicker from '../components/LocationPicker';

// 2. Bên trong hàm Component CreateDiaryScreen, chỗ quản lý các state:
const [location, setLocation] = useState<string>('');

// 3. Thay thế ô TextInput nhập địa điểm cũ bằng Component xịn này:
<LocationPicker selectedLocation={location} onSelectLocation={setLocation} />;
