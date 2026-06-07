import { useState, useRef } from 'react';
import { CameraView, CameraType } from 'expo-camera';

export const useCamera = () => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [mode, setMode] = useState<'solo' | 'group'>('solo');
  const cameraRef = useRef<CameraView>(null);

  const toggleFacing = () => {
    setFacing(f => f === 'back' ? 'front' : 'back');
  };

  const takePicture = async () => {
    if (!cameraRef.current) return null;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      return photo?.uri ?? null;
    } catch (e) {
      return null;
    }
  };

  return {
    facing,
    mode,
    setMode,
    cameraRef,
    toggleFacing,
    takePicture,
  };
};