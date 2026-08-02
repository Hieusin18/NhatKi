import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

export default function SimulatedVideo({ 
  theme = 'walk', 
  caption, 
  muted = false, 
  hour, 
  isGrid = false, 
  type = 'simulated', 
  videoUrl 
}) {
  const [visualTick, setVisualTick] = useState(0);

  // Subtle live ticking to represent playback movement
  useEffect(() => {
    if (type === 'real' && videoUrl) return;
    const timer = setInterval(() => {
      setVisualTick(prev => (prev + 1) % 100);
    }, 100);
    return () => clearInterval(timer);
  }, [type, videoUrl]);

  if (type === 'real' && videoUrl) {
    return (
      <View style={styles.container}>
        <Video
          source={{ uri: videoUrl }}
          rate={1.0}
          volume={1.0}
          isMuted={muted}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          style={StyleSheet.absoluteFill}
        />
        {/* Camera HUD Overlays */}
        <View style={styles.hudContainer}>
          <Text style={styles.hudLive}>LIVE</Text>
          <View style={styles.hudRecRow}>
            <View style={styles.redDot} />
            <Text style={styles.hudText}>2.0S</Text>
          </View>
        </View>
      </View>
    );
  }

  const getThemeConfigs = () => {
    switch (theme) {
      case 'gym':
        return {
          colors: ['#2d0d0d', '#140505', '#000000'],
          emoji: '🏋️‍♂️',
          desc: 'Workout',
          animation: 'scale',
          color: '#f87171'
        };
      case 'sleep':
        return {
          colors: ['#0f172a', '#020617', '#000000'],
          emoji: '😴',
          desc: 'Sleepy',
          animation: 'float',
          color: '#818cf8'
        };
      case 'food':
        return {
          colors: ['#2c1a04', '#170c01', '#000000'],
          emoji: '🥪',
          desc: 'Foodie',
          animation: 'bounce',
          color: '#facc15'
        };
      case 'code':
        return {
          colors: ['#022c22', '#02110c', '#000000'],
          emoji: '💻',
          desc: 'Coding',
          animation: 'pulse',
          color: '#4ade80'
        };
      case 'coffee':
        return {
          colors: ['#2a1215', '#140c0e', '#000000'],
          emoji: '☕',
          desc: 'Coffee Time',
          animation: 'steam',
          color: '#f59e0b'
        };
      case 'cat':
        return {
          colors: ['#3b0764', '#1e1b4b', '#000000'],
          emoji: '🐱',
          desc: 'Cat lover',
          animation: 'wiggle',
          color: '#f472b6'
        };
      case 'netflix':
        return {
          colors: ['#3f0712', '#18181b', '#000000'],
          emoji: '🎬',
          desc: 'Netflix',
          animation: 'flicker',
          color: '#ef4444'
        };
      case 'walk':
      default:
        return {
          colors: ['#083344', '#082f49', '#000000'],
          emoji: '🍃',
          desc: 'Walking',
          animation: 'wind',
          color: '#38bdf8'
        };
    }
  };

  const config = getThemeConfigs();

  // Dynamic animations calculation
  const getAnimatedStyles = () => {
    let scale = 1;
    let translateY = 0;
    let rotate = '0deg';
    let opacity = 1;

    if (config.animation === 'scale') {
      scale = 1 + Math.sin(visualTick / 5) * 0.08;
    } else if (config.animation === 'float') {
      translateY = Math.sin(visualTick / 4) * 6;
    } else if (config.animation === 'bounce') {
      translateY = Math.abs(Math.sin(visualTick / 3)) * -10;
    } else if (config.animation === 'wiggle') {
      rotate = `${Math.sin(visualTick / 2) * 12}deg`;
    } else if (config.animation === 'flicker') {
      opacity = 0.85 + Math.sin(visualTick / 2) * 0.15;
    } else {
      scale = 0.96 + Math.cos(visualTick / 6) * 0.04;
    }

    return {
      transform: [
        { scale },
        { translateY },
        { rotate }
      ],
      opacity
    };
  };

  return (
    <LinearGradient 
      colors={config.colors} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Background Matrix Grid */}
      <View style={styles.gridOverlay} pointerEvents="none">
        {Array.from({ length: 4 }).map((_, r) => (
          <View key={r} style={styles.gridRow}>
            {Array.from({ length: 4 }).map((_, c) => (
              <View key={c} style={styles.gridCell} />
            ))}
          </View>
        ))}
      </View>

      {/* Rec label and indicator */}
      <View style={styles.hudContainer}>
        <Text style={styles.hudRec}>REC [LOCKED]</Text>
        <View style={styles.hudFpsRow}>
          <View style={styles.redDot} />
          <Text style={styles.hudText}>HD 30FPS</Text>
        </View>
      </View>

      {/* Center emoji representation */}
      <View style={styles.centerGraphic}>
        <View style={styles.radialGlow} />
        <View style={getAnimatedStyles()}>
          <Text style={styles.emojiText}>{config.emoji}</Text>
        </View>

        {/* Dynamic Visual Audio waves if not muted and not in grid view */}
        {!muted && !isGrid && (
          <View style={styles.audioWaveRow}>
            {Array.from({ length: 8 }).map((_, index) => {
              const h = Math.abs(Math.sin((visualTick + index * 4) / 4)) * 16;
              return (
                <View 
                  key={index} 
                  style={[styles.audioWaveBar, { height: Math.max(2, h) }]} 
                />
              );
            })}
          </View>
        )}
      </View>

      {/* VHS Static Line Effect at random intervals */}
      {visualTick % 12 === 0 && (
        <View style={styles.vhsLine} />
      )}

      {/* Floating subtitle */}
      {!isGrid && (
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitleText}>{config.desc.toUpperCase()} SCENE</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    flexDirection: 'column',
    justifyContent: 'space-around',
    padding: 10,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  gridCell: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#fff',
  },
  hudContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  hudLive: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#fff',
    fontWeight: 'bold',
    opacity: 0.4,
  },
  hudRec: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#fff',
    fontWeight: 'bold',
    opacity: 0.4,
  },
  hudRecRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudFpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ef4444',
    marginRight: 4,
  },
  hudText: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#fff',
    opacity: 0.4,
  },
  centerGraphic: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radialGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  emojiText: {
    fontSize: 48,
    textAlign: 'center',
  },
  audioWaveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 20,
    marginTop: 12,
  },
  audioWaveBar: {
    width: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: 1,
  },
  vhsLine: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  subtitleContainer: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
  },
  subtitleText: {
    fontSize: 8,
    fontFamily: 'monospace',
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: 'bold',
  }
});
