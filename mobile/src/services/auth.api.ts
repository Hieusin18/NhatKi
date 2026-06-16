import apiClient from './api.service';

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/v1/auth/login', { email, password });
    return res.data;
  },

  register: async (username: string, email: string, password: string) => {
    const res = await apiClient.post('/v1/auth/register', { username, email, password });
    return res.data;
  },

  logout: async () => {
    return { success: true };
  },
};