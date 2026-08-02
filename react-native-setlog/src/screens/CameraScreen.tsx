import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  StatusBar
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THEMES = ['Đời Thường', 'Chăm Chỉ', 'Chill', 'Thể Thao', 'Du Lịch'];

interface CameraScreenProps {
  roomId: string;
  defaultHourSlot?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  roomId,
  defaultHourSlot,
  onClose,
  onSuccess
}) => {
  const { postClip, showToast } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraMode, setCameraMode] = useState<'real' | 'simulated'>('real');
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);

  // Auto-calculate closest hour slot based on Date.now() for REQ-07
  const calculateAutoHourSlot = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 9) return '07:00';
    if (currentHour >= 9 && currentHour < 13) return '11:00';
    if (currentHour >= 13 && currentHour < 17) return '15:00';
    if (currentHour >= 17 && currentHour < 20) return '18:00';
    return '21:00';
  };

  const [selectedHourSlot, setSelectedHourSlot] = useState(
    defaultHourSlot && defaultHourSlot !== 'Tất cả' ? defaultHourSlot : calculateAutoHourSlot()
  );
  const [selectedTheme, setSelectedTheme] = useState('Đời Thường');
  const [caption, setCaption] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const cameraRef = useRef<any>(null);

  // Play beep sound for 2s recording lock start/stop
  const playBeep = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' }
      );
      await sound.playAsync();
    } catch (e) {
      // ignore
    }
  };

  // Start 2.0-second clip recording
  const handleStartCapture = async () => {
    if (isRecording || recordedUri) return;

    // Start 3-2-1 countdown
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0) {
      setCountdown(null);
      execute2sRecording();
    }
  }, [countdown]);

  const execute2sRecording = async () => {
    setIsRecording(true);
    await playBeep();

    if (cameraMode === 'real' && cameraRef.current) {
      try {
        const videoPromise = cameraRef.current.recordAsync({ maxDuration: 2 });
        setTimeout(async () => {
          try {
            cameraRef.current?.stopRecording();
          } catch (e) {
            // ignore
          }
        }, 2000);

        const data = await videoPromise;
        if (data?.uri) {
          setRecordedUri(data.uri);
        } else {
          // Fallback to simulated media URI
          setRecordedUri('https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4');
        }
      } catch (err) {
        console.warn('Real camera recording error, using fallback:', err);
        setRecordedUri('https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4');
      }
    } else {
      // Simulated 2s capture
      setTimeout(async () => {
        await playBeep();
        setIsRecording(false);
        setRecordedUri('https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4');
      }, 2000);
      return;
    }

    setIsRecording(false);
  };

  const handlePostSubmit = async () => {
    if (!recordedUri) {
      showToast('Vui lòng quay clip 2s trước!');
      return;
    }

    setUploading(true);
    try {
      await postClip(
        roomId,
        recordedUri,
        selectedHourSlot,
        caption.trim() || 'Khoảnh khắc 2s Daily Vlog',
        selectedTheme,
        (progress) => setUploadProgress(progress)
      );
      setUploading(false);
      onSuccess();
    } catch (err: any) {
      console.error('Post clip error:', err);
      showToast(err?.message || 'Không thể tải clip lên');
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.hourBadge}>
          <Text style={styles.hourBadgeText}>KHUNG GIỜ: {selectedHourSlot}</Text>
        </View>

        <TouchableOpacity
          style={[styles.modeBtn, cameraMode === 'real' ? styles.modeReal : styles.modeSim]}
          onPress={() => setCameraMode(cameraMode === 'real' ? 'simulated' : 'real')}
        >
          <Text style={styles.modeBtnText}>
            {cameraMode === 'real' ? '📷 Real Cam' : '🔮 Simulated'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* CAMERA VIEWPORT RING */}
      <View style={styles.viewportWrapper}>
        <View style={styles.circularRing}>
          {countdown !== null && (
            <View style={styles.countdownOverlay}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}

          {cameraMode === 'real' && permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing="front"
              mode="video"
            />
          ) : (
            <View style={styles.simulatedBox}>
              <Text style={styles.simulatedEmoji}>📸</Text>
              <Text style={styles.simulatedText}>MÔ PHỎNG CAMERA 2S</Text>
              <Text style={styles.simulatedSub}>Bấm nút quay để tự tạo 2.0s clip</Text>
            </View>
          )}

          {recordedUri && (
            <View style={styles.recordedSuccessOverlay}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={styles.recordedLabel}>ĐÃ QUAY THÀNH CÔNG 2.0S</Text>
            </View>
          )}
        </View>
      </View>

      {/* CONTROLS & POST FORM */}
      <View style={styles.bottomSection}>
        {uploading ? (
          <View style={styles.uploadBox}>
            <ActivityIndicator color="#c8ff00" size="large" />
            <Text style={styles.uploadProgressText}>
              Đang tải clip lên Firebase... {uploadProgress}%
            </Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
            </View>
          </View>
        ) : recordedUri ? (
          <View style={styles.postFormBox}>
            <Text style={styles.label}>CHỌN CHỦ ĐỀ VLOG</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeRow}>
              {THEMES.map((theme) => (
                <TouchableOpacity
                  key={theme}
                  style={[styles.themeChip, selectedTheme === theme && styles.themeChipActive]}
                  onPress={() => setSelectedTheme(theme)}
                >
                  <Text style={[styles.themeChipText, selectedTheme === theme && styles.themeChipTextActive]}>
                    {theme}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.captionInputGroup}>
              <Text style={styles.label}>CHÚ THÍCH KHOẢNH KHẮC</Text>
              <TextInput
                style={styles.captionInput}
                placeholder="Viết caption ngắn cho 2s Vlog..."
                placeholderTextColor="#52525b"
                value={caption}
                onChangeText={setCaption}
              />
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => setRecordedUri(null)}
              >
                <Text style={styles.retakeBtnText}>Quay lại</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.postBtn} onPress={handlePostSubmit}>
                <Text style={styles.postBtnText}>ĐĂNG 2S VLOG 🚀</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.shutterBox}>
            <Text style={styles.shutterInstruction}>
              Giữ hoặc bấm nút shutter để quay 2.0s khoảnh khắc
            </Text>
            <TouchableOpacity
              style={[styles.shutterBtn, isRecording && styles.shutterBtnRecording]}
              onPress={handleStartCapture}
              disabled={isRecording || countdown !== null}
            >
              <View style={[styles.shutterInner, isRecording && styles.shutterInnerRecording]} />
            </TouchableOpacity>
            <Text style={styles.durationLimit}>2.0 SECONDS LOCK</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 30
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111115',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16
  },
  hourBadge: {
    backgroundColor: 'rgba(25,25,25,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f23'
  },
  hourBadgeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#c8ff00',
    fontWeight: 'bold'
  },
  modeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1
  },
  modeReal: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.2)'
  },
  modeSim: {
    backgroundColor: 'rgba(200,255,0,0.1)',
    borderColor: 'rgba(200,255,0,0.2)'
  },
  modeBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff'
  },
  viewportWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  circularRing: {
    width: SCREEN_WIDTH - 60,
    height: SCREEN_WIDTH - 60,
    borderRadius: (SCREEN_WIDTH - 60) / 2,
    borderColor: '#27272a',
    borderWidth: 4,
    backgroundColor: '#09090b',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  countdownText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#c8ff00'
  },
  simulatedBox: {
    alignItems: 'center',
    padding: 20
  },
  simulatedEmoji: {
    fontSize: 48,
    marginBottom: 8
  },
  simulatedText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#a1a1aa'
  },
  simulatedSub: {
    fontSize: 9,
    color: '#52525b',
    marginTop: 4
  },
  recordedSuccessOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  checkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#c8ff00',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkIcon: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000'
  },
  recordedLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#c8ff00'
  },
  bottomSection: {
    minHeight: 140,
    justifyContent: 'center'
  },
  uploadBox: {
    alignItems: 'center',
    gap: 10
  },
  uploadProgressText: {
    color: '#c8ff00',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold'
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#1f1f23',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#c8ff00'
  },
  postFormBox: {
    gap: 12
  },
  label: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#71717a'
  },
  themeRow: {
    flexDirection: 'row'
  },
  themeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#111115',
    borderWidth: 1,
    borderColor: '#1f1f23',
    marginRight: 6
  },
  themeChipActive: {
    backgroundColor: '#ff2a7a',
    borderColor: '#ff2a7a'
  },
  themeChipText: {
    fontSize: 10,
    color: '#a1a1aa',
    fontWeight: 'bold'
  },
  themeChipTextActive: {
    color: '#fff'
  },
  captionInputGroup: {
    gap: 4
  },
  captionInput: {
    backgroundColor: '#111115',
    borderWidth: 1,
    borderColor: '#1f1f23',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 12
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  retakeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#111115',
    alignItems: 'center',
    justifyContent: 'center'
  },
  retakeBtnText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: 'bold'
  },
  postBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#c8ff00',
    alignItems: 'center',
    justifyContent: 'center'
  },
  postBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900'
  },
  shutterBox: {
    alignItems: 'center'
  },
  shutterInstruction: {
    fontSize: 11,
    color: '#a1a1aa',
    marginBottom: 12,
    textAlign: 'center'
  },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#c8ff00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  shutterBtnRecording: {
    borderColor: '#ff2a7a'
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff'
  },
  shutterInnerRecording: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#ff2a7a'
  },
  durationLimit: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#52525b',
    letterSpacing: 1
  }
});
