import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCapsule } from '../../hooks/useCapsule';

export default function CreateCapsuleScreen() {
  const [title, setTitle] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const { createCapsule } = useCapsule();

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...uris]);
    }
  };

  const handleCreate = async () => {
    if (!title) return Alert.alert('Lỗi', 'Vui lòng nhập tên hộp');
    if (!openDate) return Alert.alert('Lỗi', 'Vui lòng nhập ngày mở');
    await createCapsule({ title, openDate, images });
    Alert.alert('✅ Tạo thành công', `Hộp "${title}" đã được tạo!`, [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tạo Time Capsule</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.label}>Tên hộp kỷ niệm</Text>
      <TextInput style={styles.input} placeholder="VD: Kỷ niệm hè 2026"
        placeholderTextColor="#666" value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Ngày mở hộp (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} placeholder="VD: 2027-01-01"
        placeholderTextColor="#666" value={openDate} onChangeText={setOpenDate} />

      <Text style={styles.label}>Thêm ảnh vào hộp</Text>
      <TouchableOpacity style={styles.uploadBtn} onPress={pickImages}>
        <Text style={styles.uploadTxt}>📷 Chọn ảnh từ thư viện</Text>
      </TouchableOpacity>

      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
          {images.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.thumb} />
          ))}
        </ScrollView>
      )}

      <Text style={styles.imageCount}>{images.length} ảnh đã chọn</Text>

      <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
        <Text style={styles.createTxt}>🔒 Tạo & Khoá hộp</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 40 },
  back: { color: '#6C63FF', fontSize: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  label: { color: '#aaa', fontSize: 14, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#1e1e2e', color: '#fff', padding: 16, borderRadius: 10, fontSize: 16 },
  uploadBtn: { backgroundColor: '#1e1e2e', padding: 16, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#6C63FF', borderStyle: 'dashed' },
  uploadTxt: { color: '#6C63FF', fontSize: 15, fontWeight: '600' },
  imageRow: { marginTop: 12 },
  thumb: { width: 80, height: 80, borderRadius: 8, marginRight: 8 },
  imageCount: { color: '#666', fontSize: 13, marginTop: 8, marginBottom: 8 },
  createBtn: { backgroundColor: '#6C63FF', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  createTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});