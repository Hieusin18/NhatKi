import apiClient from './api.service';

export const capsuleApi = {
  getAll: async () => {
    // const res = await apiClient.get('/capsule');
    // return res.data;
    return [
      { id: '1', title: 'Kỷ niệm nhóm tháng 6', openDate: '2026-12-31', isLocked: true, images: 3 },
      { id: '2', title: 'Ngày đầu tiên', openDate: '2026-06-04', isLocked: false, images: 5 },
      { id: '3', title: 'Mục tiêu 2027', openDate: '2027-01-01', isLocked: true, images: 1 },
    ];
  },

  create: async (data: { title: string; openDate: string; images: string[] }) => {
    // const res = await apiClient.post('/capsule', data);
    // return res.data;
    return { id: Date.now().toString(), ...data, isLocked: true };
  },

  open: async (id: string) => {
    // const res = await apiClient.post(`/capsule/${id}/open`);
    // return res.data;
    return { success: true, contents: [] };
  },
};