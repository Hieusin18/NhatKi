import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'solo' | 'group'>('solo');
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Cần quyền truy cập camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Cấp quyền</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      router.push({ pathname: '/(main)/preview', params: { uri: photo?.uri, mode } });
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  const toggleFacing = () => {
    setFacing(f => f === 'back' ? 'front' : 'back');
  };

  return (
    <View style={styles.container}>
      {/* Mode selector */}
      <View style={styles.modeBar}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'solo' && styles.modeBtnActive]}
          onPress={() => setMode('solo')}>
          <Text style={[styles.modeTxt, mode === 'solo' && styles.modeTxtActive]}>Solo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'group' && styles.modeBtnActive]}
          onPress={() => setMode('group')}>
          <Text style={[styles.modeTxt, mode === 'group' && styles.modeTxtActive]}>Nhóm</Text>
        </TouchableOpacity>
      </View>

      {/* Camera */}
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.controls}>
          {/* Flip button */}
          <TouchableOpacity style={styles.flipBtn} onPress={toggleFacing}>
            <Text style={styles.flipTxt}>🔄</Text>
          </TouchableOpacity>

          {/* Shutter button */}
          <TouchableOpacity style={styles.shutter} onPress={takePicture}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.flipTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      {mode === 'group' && (
        <View style={styles.realtimeBar}>
          <Text style={styles.realtimeTxt}>🟢 Nhóm đang online (mock)</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  text: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  camera: { flex: 1 },
  modeBar: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: 12, backgroundColor: '#0f0f1a' },
  modeBtn: { paddingVertical: 6, paddingHorizontal: 24, borderRadius: 20, backgroundColor: '#1e1e2e' },
  modeBtnActive: { backgroundColor: '#6C63FF' },
  modeTxt: { color: '#888', fontWeight: '600' },
  modeTxtActive: { color: '#fff' },
  controls: { position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  shutter: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', borderWidth: 2, borderColor: '#000' },
  flipBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  backBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  flipTxt: { fontSize: 20 },
  button: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  realtimeBar: { backgroundColor: '#0f0f1a', padding: 10, alignItems: 'center' },
  realtimeTxt: { color: '#4ade80', fontSize: 13 },
});