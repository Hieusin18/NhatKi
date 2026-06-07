import { useState } from 'react';
import { capsuleStore } from '../store/capsuleStore';
import { capsuleApi } from '../services/capsule.api';

export const useCapsule = () => {
  const [capsules, setCapsules] = useState(capsuleStore.getAll());
  const [loading, setLoading] = useState(false);

  const fetchCapsules = async () => {
    setLoading(true);
    try {
      // Khi backend xong dùng API thật
      // const data = await capsuleApi.getAll();
      // setCapsules(data);
      setCapsules(capsuleStore.getAll());
    } finally {
      setLoading(false);
    }
  };

  const createCapsule = async (data: {
    title: string;
    openDate: string;
    images: string[];
  }) => {
    setLoading(true);
    try {
      // Khi backend xong dùng API thật
      // const newCapsule = await capsuleApi.create(data);
      const newCapsule = capsuleStore.add({
        title: data.title,
        openDate: data.openDate,
        isLocked: true,
        images: data.images.length,
      });
      setCapsules(capsuleStore.getAll());
      return newCapsule;
    } finally {
      setLoading(false);
    }
  };

  return {
    capsules,
    loading,
    fetchCapsules,
    createCapsule,
  };
};