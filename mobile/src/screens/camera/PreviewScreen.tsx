import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { mediaApi } from '../../services/media.api';

export default function PreviewScreen() {
  const { uri, mode } = useLocalSearchParams<{ uri: string; mode: string }>();

  const savePhoto = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần quyền lưu ảnh');
      return;
    }
    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert('✅ Đã lưu', 'Ảnh đã được lưu vào thư viện!');
  };

  const sharePhoto = async () => {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Lỗi', 'Thiết bị không hỗ trợ share');
      return;
    }
    await Sharing.shareAsync(uri);
  };

  const postToGroup = async () => {
    // Khi backend xong: upload ảnh rồi post lên nhóm
    // const uploaded = await mediaApi.uploadImage(uri);
    Alert.alert('✅ Đã đăng', 'Ảnh đã được chia sẻ lên nhóm! (mock)', [
      { text: 'OK', onPress: () => router.replace('/(main)/index') }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xem trước</Text>
      {uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTxt}>Không có ảnh</Text>
        </View>
      )}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => router.back()}>
          <Text style={styles.btnSecondaryTxt}>📷 Chụp lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={savePhoto}>
          <Text style={styles.btnPrimaryTxt}>💾 Lưu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={sharePhoto}>
          <Text style={styles.btnPrimaryTxt}>📤 Share</Text>
        </TouchableOpacity>
      </View>
      {mode === 'group' && (
        <TouchableOpacity style={styles.btnGroup} onPress={postToGroup}>
          <Text style={styles.btnGroupTxt}>👥 Đăng lên nhóm</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 16, marginTop: 40 },
  image: { width: '100%', flex: 1, borderRadius: 16, marginBottom: 16 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderTxt: { color: '#666' },
  actions: { flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 12 },
  btnPrimary: { backgroundColor: '#6C63FF', padding: 14, borderRadius: 10, alignItems: 'center', flex: 1, marginHorizontal: 4 },
  btnPrimaryTxt: { color: '#fff', fontWeight: '600' },
  btnSecondary: { backgroundColor: '#1e1e2e', padding: 14, borderRadius: 10, alignItems: 'center', flex: 1, marginHorizontal: 4 },
  btnSecondaryTxt: { color: '#aaa', fontWeight: '600' },
  btnGroup: { backgroundColor: '#4ade80', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  btnGroupTxt: { color: '#000', fontWeight: '700', fontSize: 16 },
});