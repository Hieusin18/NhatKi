# Changelog

Tất cả thay đổi đáng chú ý của dự án **Setlog** được ghi lại tại đây.

Định dạng theo [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Phiên bản theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-06-19

### Tóm tắt
Bản phát hành MVP đầu tiên của Setlog — ứng dụng nhật ký cá nhân tích hợp Time Capsule, Mood Tracking và Group Check-in.

### Added — Tính năng mới
- **Auth:** Đăng ký, đăng nhập bằng JWT; kết nối REST API thật từ mobile
- **Core Journal:** Tạo, chỉnh sửa, xóa nhật ký cá nhân; xem timeline
- **Group Feed:** Xem feed nhóm, reaction, comment; lịch sử nhóm; tìm kiếm ảnh
- **Time Capsule:** Tạo capsule, thiết lập thời gian mở khóa, gửi cho người khác; thông báo tự động qua node-cron khi đến hạn
- **Mood Tracking:** Chọn & lưu cảm xúc hằng ngày; biểu đồ xu hướng 30 ngày; tính năng "Ngày này năm xưa"
- **Group Check-in:** Phiên check-in real-time qua WebSocket; chụp ảnh từ camera native; hiển thị trạng thái online thành viên
- **Mobile UI:** Thiết kế lại giao diện theo phong cách Minimal Light, thêm Capsule Tab với pink theme
- **DevOps:** CI/CD qua GitHub Actions (build Docker image → push GHCR → SSH deploy → smoke-test `/health`); Monitoring với Prometheus + Grafana + Loki + Alertmanager
- **API Docs:** Swagger UI tích hợp tại `/api-docs`

### Infrastructure
- Deploy production trên VPS Ubuntu 22.04 với Docker Compose
- Nginx reverse proxy với TLS (Let's Encrypt)
- Backend REST API (Express + Sequelize + MySQL 8) · port 4000
- Realtime service (Socket.io + Prisma) · port 5000
- Media lưu trên Cloudinary; push notification qua FCM
- `.env.production.example` cung cấp sẵn cho onboarding

### Known Issues
- Realtime service và REST API đang dùng hai ORM khác nhau (Sequelize vs Prisma) — sẽ thống nhất trong v1.1.0
- Admin Panel chưa hoàn thiện (dashboard và kiểm duyệt nội dung)
- Xuất dữ liệu nhật ký chưa triển khai

---

## [Unreleased]

### Planned
- Thống nhất ORM về một stack duy nhất
- Hoàn thiện Admin Panel
- Tính năng xuất dữ liệu nhật ký (PDF/JSON)
- Nhắc nhở viết nhật ký hằng ngày (push notification)

---

[1.0.0]: https://github.com/Hieusin18/NhatKi/releases/tag/v1.0.0
[Unreleased]: https://github.com/Hieusin18/NhatKi/compare/v1.0.0...HEAD
