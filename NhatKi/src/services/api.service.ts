import axios from "axios";

// Định nghĩa URL gốc kết nối đến Server API của nhóm bạn
// (Sau này bạn có thể đổi localhost thành địa chỉ IP máy của bạn Backend Lead nhé)
const BASE_URL = "http://localhost:5000/api";

export const apiService = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // Thời gian chờ tối đa cho một request là 10 giây
  headers: {
    "Content-Type": "application/json",
  },
});

// Bộ đánh chặn (Interceptor) tự động đính kèm mã đăng nhập Token vào mỗi request
apiService.interceptors.request.use(
  async (config) => {
    // Sau này khi làm module Auth đăng nhập, bạn sẽ lấy token lưu ở máy ra cấu hình tại đây
    // const token = await localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
