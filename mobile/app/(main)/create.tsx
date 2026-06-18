import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, SafeAreaView, Switch, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const MOODS = ['😊', '😐', '😢', '🤩', '😡', '😴'];

export default function Create() {
  const [selectedMood, setSelectedMood] = useState(0);
  const [caption, setCaption] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [image, setImage] = useState<string | null>(null);

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần quyền truy cập camera để chụp ảnh.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("=== LỖI CAMERA THỰC TẾ ===", error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("=== LỖI THƯ VIỆN THỰC TẾ ===", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerX}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Viết bài mới ✨</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
          <Text style={styles.doneBtnText}>Xong</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.photoBox}>
          {image ? (
            <Image source={{ uri: image }} style={{ width: '90%', height: 180, borderRadius: 12, marginBottom: 10 }} />
          ) : (
            <>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoLabel}>Thêm ảnh của bạn</Text>
            </>
          )}
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoBtn} onPress={openCamera}>
              <Text style={styles.photoBtnIcon}>📷</Text>
              <Text style={styles.photoBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
              <Text style={styles.photoBtnIcon}>🖼️</Text>
              <Text style={styles.photoBtnText}>Thư viện</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tâm trạng hôm nay?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((mood, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.moodBtn, selectedMood === i && styles.moodBtnActive]}
                onPress={() => setSelectedMood(i)}
              >
                <Text style={styles.moodEmoji}>{mood}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Câu chuyện hôm nay</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Hôm nay của bạn thế nào? 😊"
            placeholderTextColor="#ccc"
            multiline
            numberOfLines={5}
            value={caption}
            onChangeText={setCaption}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.publicRow}>
          <View style={styles.publicLeft}>
            <Text style={styles.publicIcon}>🌐</Text>
            <View>
              <Text style={styles.publicTitle}>Công khai</Text>
              <Text style={styles.publicSub}>Tất cả bạn bè có thể xem</Text>
            </View>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: '#eee', true: '#FF69B4' }}
            thumbColor="#fff"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#FFE4EE',
  },
  headerX: { fontSize: 20, color: '#aaa', width: 36 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#9B59B6' },
  doneBtn: {
    backgroundColor: '#FF69B4', paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20,
  },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  scroll: { padding: 16, gap: 20, paddingBottom: 40 },

  photoBox: {
    borderWidth: 2, borderColor: '#FFB6C1', borderStyle: 'dashed',
    borderRadius: 16, backgroundColor: '#FFF0F7',
    paddingVertical: 32, alignItems: 'center', gap: 8,
  },
  photoIcon: { fontSize: 44, opacity: 0.5 },
  photoLabel: { fontSize: 14, color: '#aaa' },
  photoActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: '#FFB6C1',
  },
  photoBtnIcon: { fontSize: 16 },
  photoBtnText: { fontSize: 13, color: '#555', fontWeight: '600' },

  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#FF69B4' },

  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FFF0F7', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  moodBtnActive: { borderColor: '#FF69B4', backgroundColor: '#FFE4EE' },
  moodEmoji: { fontSize: 26 },

  textArea: {
    backgroundColor: '#FFF8FB', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#FFE4EE',
    padding: 14, fontSize: 14, color: '#333',
    minHeight: 120,
  },

  publicRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8FFF8', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#E4FFE4',
  },
  publicLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  publicIcon: { fontSize: 24 },
  publicTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
  publicSub: { fontSize: 12, color: '#aaa', marginTop: 1 },
});
