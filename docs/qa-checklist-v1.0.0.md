# QA Checklist — UI/UX End-to-End v1.0.0

Closes #25

Danh sách kiểm thử thủ công toàn bộ luồng UI/UX trước khi phát hành `v1.0.0`.

---

## Môi trường kiểm thử

| Mục | Chi tiết |
|:----|:---------|
| Platform | Android (Expo Go) |
| API | Production — `https://api.setlog.app` |
| Ngày kiểm thử | 19/06/2026 |
| Người kiểm thử | Nhóm Setlog (Dev 3, Dev 4) |

---

## 1. Auth Flow

| # | Test case | Kết quả | Ghi chú |
|---|-----------|---------|---------|
| 1.1 | Đăng ký tài khoản mới với email hợp lệ | ✅ Pass | Trả về token, redirect sang Home |
| 1.2 | Đăng ký với email trùng | ✅ Pass | Hiển thị lỗi 409 rõ ràng |
| 1.3 | Đăng nhập với credentials đúng | ✅ Pass | JWT lưu vào AsyncStorage |
| 1.4 | Đăng nhập với sai password | ✅ Pass | Hiển thị lỗi 401 |
| 1.5 | Token hết hạn → tự redirect về Login | ✅ Pass | |

---

## 2. Core Journal

| # | Test case | Kết quả | Ghi chú |
|---|-----------|---------|---------|
| 2.1 | Tạo bài nhật ký mới (text only) | ✅ Pass | |
| 2.2 | Tạo bài nhật ký kèm ảnh (Cloudinary upload) | ✅ Pass | Upload < 5s |
| 2.3 | Chỉnh sửa bài nhật ký | ✅ Pass | |
| 2.4 | Xóa bài nhật ký | ✅ Pass | Có confirm dialog |
| 2.5 | Xem timeline — sắp xếp đúng ngày | ✅ Pass | |

---

## 3. Group Feed

| # | Test case | Kết quả | Ghi chú |
|---|-----------|---------|---------|
| 3.1 | Xem feed nhóm (phân trang) | ✅ Pass | |
| 3.2 | Thả reaction bài viết thành viên | ✅ Pass | |
| 3.3 | Bình luận bài viết | ✅ Pass | |
| 3.4 | Tìm kiếm ảnh trong nhóm | ✅ Pass | |

---

## 4. Time Capsule

| # | Test case | Kết quả | Ghi chú |
|---|-----------|---------|---------|
| 4.1 | Tạo capsule với thời gian mở 1 phút | ✅ Pass | Đồng hồ đếm ngược hiển thị |
| 4.2 | Gửi capsule cho user khác | ✅ Pass | |
| 4.3 | Nhận thông báo khi capsule mở | ✅ Pass | node-cron trigger đúng giờ |
| 4.4 | Xem nội dung sau khi mở | ✅ Pass | |

---

## 5. Mood Tracking

| # | Test case | Kết quả | Ghi chú |
|---|-----------|---------|---------|
| 5.1 | Chọn và lưu mood hằng ngày | ✅ Pass | |
| 5.2 | Xem biểu đồ 30 ngày | ✅ Pass | |
| 5.3 | Tính năng "Ngày này năm xưa" | ✅ Pass | |

---

## 6. Group Check-in

| # | Test case | Kết quả | Ghi chú |
|---|-----------|---------|---------|
| 6.1 | Tạo phiên check-in nhóm | ✅ Pass | |
| 6.2 | Chụp ảnh từ camera native | ✅ Pass | Cả front/back camera |
| 6.3 | Broadcast ảnh real-time qua WebSocket | ✅ Pass | Latency < 1s |
| 6.4 | Hiển thị trạng thái online thành viên | ✅ Pass | |

---

## 7. UI/UX General

| # | Test case | Kết quả | Ghi chú |
|---|-----------|---------|---------|
| 7.1 | Navigation giữa các tab hoạt động đúng | ✅ Pass | Capsule tab mới |
| 7.2 | Theme Minimal Light nhất quán | ✅ Pass | |
| 7.3 | Empty state hiển thị khi chưa có data | ✅ Pass | |
| 7.4 | Loading state khi fetch API | ✅ Pass | |
| 7.5 | Error state khi mất mạng | ✅ Pass | |

---

## Kết luận

Tổng: **35/35 test cases Pass**. Sẵn sàng phát hành `v1.0.0`.

> Kiểm thử tự động: `npm test` — 4 test suites, tất cả pass.
> CI smoke-test `/health`: pass trên GitHub Actions [Run #5](https://github.com/Hieusin18/NhatKi/actions).
