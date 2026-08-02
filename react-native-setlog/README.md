# Hướng dẫn Chạy App SetLog 2s Vlog dạng Native (React Native + Expo) trên Điện thoại của bạn

Để biến dự án Web hiện tại thành một ứng dụng di động Native thực thụ chạy mượt mà trên cả **iOS (iPhone)** và **Android (Samsung, Xiaomi, Oppo, ...)**, chúng tôi đã khởi tạo sẵn cấu trúc mã nguồn Native bằng **Expo SDK** trong thư mục `/react-native-setlog` này.

Dưới đây là các bước cực kỳ đơn giản để bạn chạy thử nghiệm ứng dụng này trực tiếp trên điện thoại của mình trong chưa đầy 3 phút:

---

## 🚀 Bước 1: Chuẩn bị trên máy tính của bạn
1. Hãy tải xuống mã nguồn của dự án này (Bạn có thể nhấp vào **Settings (Cài đặt) -> Export (Xuất mã nguồn) -> ZIP** ở góc trên bên phải màn hình AI Studio để tải về máy).
2. Giải nén thư mục vừa tải xuống và mở terminal tại thư mục con `/react-native-setlog`.

---

## 📲 Bước 2: Cài đặt ứng dụng "Expo Go" trên điện thoại
Để chạy demo nhanh chóng không cần cáp kết nối hay tài khoản lập trình viên:
- **iPhone (iOS):** Lên App Store tìm và tải ứng dụng **Expo Go**.
- **Android:** Lên Google Play Store tìm và tải ứng dụng **Expo Go**.

---

## 🛠️ Bước 3: Cài đặt thư viện & Khởi chạy dự án
Mở terminal/cmd trên máy tính của bạn, di chuyển vào thư mục `/react-native-setlog` và chạy các lệnh sau:

```bash
# 1. Cài đặt các thư viện cần thiết
npm install

# 2. Khởi động máy chủ Expo Development
npm start
```

---

## 📸 Bước 4: Quét mã QR để mở app trên điện thoại

Sau khi chạy lệnh `npm start`, terminal trên máy tính của bạn sẽ hiển thị một **Mã QR Code lớn**.

1. **Nếu dùng Android:** Mở ứng dụng **Expo Go** trên điện thoại -> Chọn mục **Scan QR Code** và quét mã QR trên màn hình máy tính.
2. **Nếu dùng iPhone (iOS):** Mở ứng dụng **Camera mặc định của iPhone** -> Di camera vào mã QR để nhận diện -> Chấp nhận mở bằng ứng dụng **Expo Go**.

🎉 **Ứng dụng SetLog Native sẽ tự động tải xuống và chạy mượt mà trên điện thoại của bạn!**

---

## 💡 Các tính năng nổi bật đã tích hợp trong phiên bản App Mobile Native:
1. **Camera quay clip 2s thực tế:** Tích hợp camera thực với API `expo-camera` và `expo-av`, cho phép bạn giữ nút chụp để quay clip thật 2 giây và chạy lặp vô hạn.
2. **Hệ thống chuyển đổi Chế độ Giả lập / Camera Thật:** Nếu bạn chạy trên máy ảo giả lập (Emulator), ứng dụng sẽ tự động gợi ý sang Chế độ Giả lập các hoạt động (Gym, Cà phê, Lập trình, Nuôi mèo) vô cùng sinh động.
3. **Giao diện chuẩn Smartphone:** Đã được tối ưu hóa hiển thị cho mọi kích thước màn hình điện thoại (Safe Area View, tai thỏ, Dynamic Island).
4. **Mời bạn bè & Quản lý nhóm:** Trải nghiệm mời bạn bè, tạo phòng chung đầy đủ tính năng hoàn chỉnh.
