import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';
// Khi backend deploy xong đổi URL này là xong

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động thêm token vào mỗi request
apiClient.interceptors.request.use((config) => {
  // Khi có auth thật thì lấy token từ store
  // const token = authStore.getState().token;
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;