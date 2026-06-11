import apiClient from './api.service';

export const mediaApi = {
  uploadImage: async (uri: string) => {
    // Mock tạm - khi backend + Cloudinary xong thì dùng code dưới
    // const formData = new FormData();
    // formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' } as any);
    // const res = await apiClient.post('/media/upload', formData, {
    //   headers: { 'Content-Type': 'multipart/form-data' },
    // });
    // return res.data;
    return { url: uri, publicId: 'mock_id_' + Date.now() };
  },

  deleteImage: async (publicId: string) => {
    // const res = await apiClient.delete(`/media/${publicId}`);
    // return res.data;
    return { success: true };
  },
};