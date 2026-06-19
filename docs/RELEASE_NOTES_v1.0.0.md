# v1.0.0 — Setlog MVP Release

## Summary

Đây là bản phát hành MVP đầu tiên của **Setlog** — ứng dụng nhật ký cá nhân tích hợp Time Capsule, Mood Tracking và Group Check-in real-time.

Bản này đánh dấu hoàn thành 4 sprint phát triển với đầy đủ backend, mobile app và hạ tầng production.

---

## New Features

### Auth & Core
- Đăng ký / Đăng nhập với JWT — kết nối mobile với REST API thật
- Tạo, chỉnh sửa, xóa nhật ký cá nhân; xem theo timeline

### Group Feed
- Xem feed nhóm với phân trang
- Reaction và comment bài viết thành viên
- Lịch sử nhóm và tìm kiếm ảnh (`#24`)

### Time Capsule
- Tạo capsule với thời gian mở khóa tuỳ chỉnh
- Gửi capsule cho người dùng khác trong hệ thống
- Thông báo tự động khi đến hạn mở (node-cron)

### Mood Tracking
- Chọn và lưu cảm xúc hằng ngày
- Biểu đồ xu hướng 30 ngày
- Gợi ý bài viết cũ theo cảm xúc; tính năng "Ngày này năm xưa"

### Group Check-in (Real-time)
- Phiên check-in nhóm qua WebSocket (Socket.io)
- Chụp ảnh trực tiếp từ camera native để check-in
- Hiển thị trạng thái online của thành viên real-time

### Mobile UI
- Thiết kế lại theo phong cách Minimal Light
- Thêm Capsule Tab với pink theme

### DevOps & Infrastructure
- CI/CD: GitHub Actions → build Docker image → push GHCR → SSH deploy → smoke-test `/health`
- Nginx reverse proxy với TLS (Let's Encrypt)
- Monitoring: Prometheus + Grafana + Loki + Alertmanager (Slack alerts)
- Swagger API docs tại `/api-docs`

---

## Bug Fixes

- Fix JSEngine chuyển sang JSC để hỗ trợ private properties (`f7b490f`)
- Fix babel.config.js cho Expo (`f17fbff`)
- Fix OpenSSL và Prisma binaryTarget cho Alpine Linux (`1f750a9`)
- Fix API base URL cho Railway production (`87b7d03`)

---

## Changed

- Chuyển đổi toàn bộ backend module từ TypeScript sang JavaScript (`7ec042a`)
- Cấu trúc lại `src/` theo phân công Dev (`541528f`)

---

## Known Issues

- Realtime service (Prisma) và REST API (Sequelize) đang dùng hai ORM khác nhau — sẽ thống nhất ở v1.1.0
- Admin Panel chưa hoàn thiện
- Tính năng xuất dữ liệu nhật ký chưa triển khai

---

## Installation / Upgrade

### Docker (khuyến nghị)

```bash
git clone https://github.com/Hieusin18/NhatKi.git
cd NhatKi
git checkout v1.0.0

cp deploy/.env.production.example deploy/.env.production
# Điền: DB_*, JWT_SECRET, CLOUDINARY_*, MAP_API_KEY

cd deploy
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml exec backend npm run migrate
docker compose -f docker-compose.prod.yml exec backend npm run seed

curl http://localhost/health   # phải trả về {"status":"ok"}
```

### Chạy trực tiếp (không Docker)

```bash
npm install && cp deploy/.env.production.example .env
npm run migrate && npm run seed
npm run dev   # REST API · port 4000

# Realtime service
cd backend && npm install && npm run dev   # port 5000

# Mobile
cd mobile && npm install && npx expo start
```

Xem đầy đủ tại [`deploy/DEPLOYMENT.md`](./deploy/DEPLOYMENT.md).

---

## Testing Evidence

- Unit tests: `npm test` (Jest) — xem [`tests/`](./tests/)
- CI smoke-test `/health` sau mỗi deploy: [GitHub Actions](https://github.com/Hieusin18/NhatKi/actions/workflows/deploy-prod.yml)
- Swagger UI: `/api-docs` để test API thủ công

---

## Contributors

| Thành viên | Vai trò |
|:-----------|:--------|
| [Hieusin18](https://github.com/Hieusin18) | Dev 1 — Backend Lead |
| [cần bổ sung] | Dev 2 — Backend |
| [cần bổ sung] | Dev 3 — Mobile |
| [cần bổ sung] | Dev 4 — Mobile UI |
| [cần bổ sung] | Dev 5 — DevOps |

---

**Full Changelog:** https://github.com/Hieusin18/NhatKi/blob/main/CHANGELOG.md
