import apiClient from './api.service';

export const authApi = {
  login: async (email: string, password: string) => {
    // Mock tạm - khi backend xong bỏ comment dòng dưới
    // const res = await apiClient.post('/auth/login', { email, password });
    // return res.data;
    return { token: 'mock_token_123', user: { email, name: 'User' } };
  },

  register: async (name: string, email: string, password: string) => {
    // const res = await apiClient.post('/auth/register', { name, email, password });
    // return res.data;
    return { success: true };
  },

  logout: async () => {
    // const res = await apiClient.post('/auth/logout');
    return { success: true };
  },
};