import React, { useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LogDetailScreen } from '../screens/LogDetailScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { VlogPlayerScreen } from '../screens/VlogPlayerScreen';
import { LogRoom, Clip } from '../types';

export const AppNavigator: React.FC = () => {
  const { currentUser, authLoading, currentRoom, setCurrentRoom, toastMessage } = useApp();

  const [activeScreen, setActiveScreen] = useState<'home' | 'logDetail' | 'camera' | 'vlogPlayer'>('home');
  const [cameraHourSlot, setCameraHourSlot] = useState('15:00');
  const [playerClips, setPlayerClips] = useState<Clip[]>([]);

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c8ff00" />
        <Text style={styles.loadingText}>Đang khởi động SetLog...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <View style={styles.container}>
      {/* TOAST NOTIFICATION BADGE */}
      {toastMessage && (
        <View style={styles.toastBox}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* ACTIVE SCREEN ROUTING */}
      {activeScreen === 'home' && (
        <HomeScreen
          onSelectRoom={(room) => {
            setCurrentRoom(room);
            setActiveScreen('logDetail');
          }}
        />
      )}

      {activeScreen === 'logDetail' && currentRoom && (
        <LogDetailScreen
          room={currentRoom}
          onBack={() => {
            setCurrentRoom(null);
            setActiveScreen('home');
          }}
          onOpenCamera={(hourSlot) => {
            setCameraHourSlot(hourSlot);
            setActiveScreen('camera');
          }}
          onOpenPlayer={(clips) => {
            setPlayerClips(clips);
            setActiveScreen('vlogPlayer');
          }}
        />
      )}

      {activeScreen === 'camera' && currentRoom && (
        <CameraScreen
          roomId={currentRoom.id}
          defaultHourSlot={cameraHourSlot}
          onClose={() => setActiveScreen('logDetail')}
          onSuccess={() => setActiveScreen('logDetail')}
        />
      )}

      {activeScreen === 'vlogPlayer' && currentRoom && (
        <VlogPlayerScreen
          clips={playerClips}
          roomId={currentRoom.id}
          onClose={() => setActiveScreen('logDetail')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0e'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0c0c0e',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#a1a1aa'
  },
  toastBox: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: 'rgba(255, 42, 122, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8
  },
  toastText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});
