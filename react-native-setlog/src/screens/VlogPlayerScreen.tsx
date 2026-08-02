import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useApp } from '../context/AppContext';
import { Clip } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const REACTION_EMOJIS = ['❤️', '🔥', '😂', '😮', '👏', '🎉'];

interface VlogPlayerScreenProps {
  clips: Clip[];
  roomId: string;
  onClose: () => void;
}

export const VlogPlayerScreen: React.FC<VlogPlayerScreenProps> = ({
  clips,
  roomId,
  onClose
}) => {
  const { addReaction } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [floatingParticles, setFloatingParticles] = useState<
    { id: string; emoji: string; animX: Animated.Value; animY: Animated.Value; animOpacity: Animated.Value }[]
  >([]);

  const currentClip = clips[currentIndex];
  const videoRef = useRef<any>(null);

  // Auto advance to next clip after duration
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (currentIndex < clips.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onClose();
      }
    }, 3500); // 3.5s playback per clip

    return () => clearTimeout(timer);
  }, [currentIndex, isPlaying, clips.length]);

  const handleTapLeft = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleTapRight = () => {
    if (currentIndex < clips.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Trigger floating particle effect & save to Firestore (REQ-09)
  const handleEmojiClick = async (emoji: string) => {
    if (!currentClip) return;

    // Save reaction to Firestore
    await addReaction(roomId, currentClip.id, emoji);

    // Spawn floating particle animation
    const particleId = `p_${Date.now()}_${Math.random()}`;
    const animY = new Animated.Value(0);
    const animX = new Animated.Value(Math.random() * 40 - 20);
    const animOpacity = new Animated.Value(1);

    setFloatingParticles((prev) => [
      ...prev,
      { id: particleId, emoji, animX, animY, animOpacity }
    ]);

    Animated.parallel([
      Animated.timing(animY, {
        toValue: -150,
        duration: 1000,
        useNativeDriver: true
      }),
      Animated.timing(animOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true
      })
    ]).start(() => {
      setFloatingParticles((prev) => prev.filter((p) => p.id !== particleId));
    });
  };

  if (!currentClip) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff' }}>Không tìm thấy clip nào!</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={{ color: '#fff' }}>Đóng</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* VIDEO PLAYER BACKGROUND */}
      <Video
        ref={videoRef}
        style={StyleSheet.absoluteFillObject}
        source={{ uri: currentClip.videoUrl }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={isPlaying}
        isLooping
      />

      {/* FLOATING PARTICLES (REQ-09) */}
      <View style={styles.particleContainer} pointerEvents="none">
        {floatingParticles.map((p) => (
          <Animated.Text
            key={p.id}
            style={[
              styles.floatingEmoji,
              {
                opacity: p.animOpacity,
                transform: [
                  { translateY: p.animY },
                  { translateX: p.animX }
                ]
              }
            ]}
          >
            {p.emoji}
          </Animated.Text>
        ))}
      </View>

      {/* TOP SEGMENTED PROGRESS HUD */}
      <View style={styles.topHud}>
        <View style={styles.segmentedProgressRow}>
          {clips.map((clip, idx) => (
            <View key={clip.id} style={styles.segmentTrack}>
              <View
                style={[
                  styles.segmentFill,
                  {
                    width:
                      idx < currentIndex
                        ? '100%'
                        : idx === currentIndex
                        ? '100%'
                        : '0%'
                  }
                ]}
              />
            </View>
          ))}
        </View>

        {/* AUTHOR HEADER */}
        <View style={styles.authorHeader}>
          <View style={styles.authorLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{currentClip.memberAvatar || '😎'}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{currentClip.memberName}</Text>
              <Text style={styles.hourSlotSub}>{currentClip.hourSlot} Daily Vlog</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TAP NAVIGATION TOUCH ZONES */}
      <View style={styles.tapNavigationZone}>
        <TouchableOpacity style={styles.tapZoneLeft} onPress={handleTapLeft} />
        <TouchableOpacity style={styles.tapZoneMiddle} onPress={handleTogglePlay} />
        <TouchableOpacity style={styles.tapZoneRight} onPress={handleTapRight} />
      </View>

      {/* CENTER HOUR STAMP OVERLAY */}
      <View style={styles.centerClockOverlay} pointerEvents="none">
        <Text style={styles.centerClockText}>{currentClip.hourSlot}</Text>
        <View style={styles.themeBadge}>
          <Text style={styles.themeBadgeText}>#{currentClip.theme || 'DailyVlog'}</Text>
        </View>
      </View>

      {/* BOTTOM HUD PANEL */}
      <View style={styles.bottomHud}>
        {/* CAPTION */}
        <Text style={styles.captionText}>"{currentClip.caption || 'Khoảnh khắc 2s Daily Vlog'}"</Text>

        {/* REACTIONS EMOJI BAR (REQ-09) */}
        <View style={styles.reactionsBar}>
          {REACTION_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.emojiBtn}
              onPress={() => handleEmojiClick(emoji)}
            >
              <Text style={styles.emojiBtnText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between'
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90
  },
  floatingEmoji: {
    fontSize: 48,
    position: 'absolute',
    bottom: 120
  },
  topHud: {
    zIndex: 20,
    paddingTop: 50,
    paddingHorizontal: 16
  },
  segmentedProgressRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12
  },
  segmentTrack: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden'
  },
  segmentFill: {
    height: '100%',
    backgroundColor: '#fff'
  },
  authorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarEmoji: {
    fontSize: 20
  },
  authorName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#fff'
  },
  hourSlotSub: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#c8ff00'
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16
  },
  tapNavigationZone: {
    position: 'absolute',
    top: 100,
    bottom: 180,
    left: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 10
  },
  tapZoneLeft: {
    flex: 1
  },
  tapZoneMiddle: {
    flex: 1
  },
  tapZoneRight: {
    flex: 1
  },
  centerClockOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5
  },
  centerClockText: {
    fontSize: 68,
    fontFamily: 'monospace',
    fontWeight: '900',
    color: '#c8ff00',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 4 },
    textShadowRadius: 10
  },
  themeBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 4
  },
  themeBadgeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#e4e4e7',
    fontWeight: 'bold'
  },
  bottomHud: {
    zIndex: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
    alignItems: 'center'
  },
  captionText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4
  },
  reactionsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(24,24,27,0.85)',
    borderColor: '#1f1f23',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12
  },
  emojiBtn: {
    padding: 2
  },
  emojiBtnText: {
    fontSize: 24
  }
});
