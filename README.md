# Setlog — Personal Memory & Emotional Timeline System

> Your life, organized. Your memories, preserved. Your emotions, understood.

[![Deploy Production](https://github.com/Hieusin18/NhatKi/actions/workflows/deploy-prod.yml/badge.svg)](https://github.com/Hieusin18/NhatKi/actions/workflows/deploy-prod.yml)

---

## Tổng quan (Overview)

**Setlog** là ứng dụng nhật ký cá nhân kết hợp quản lý ký ức và theo dõi cảm xúc. Người dùng có thể ghi lại nhật ký hằng ngày, đính kèm media, theo dõi mood và tạo **Time Capsule** — nơi lưu ký ức để mở trong tương lai.

Tài liệu đặc tả đầy đủ: [SRS.md](./SRS.md) | Thiết kế Figma: [Xem prototype](https://www.figma.com/make/hv8zZ7b3CEzy6ZDuWe36rN/Design-mobile-group-diary-UI?t=5STs7MFqWbn4Bh88-20&fullscreen=1&preview-route=%2Ftimeline)

---

## Kiến trúc hệ thống (Architecture)

```text
   Mobile App (Expo/React Native)
         │
         ▼
   Nginx (TLS, rate-limit)
    ├── /auth /diary /feed /capsules  ──▶  REST API  (Express + Sequelize + MySQL · port 4000)
    ├── /socket.io/ /api/v1/media     ──▶  Realtime  (Socket.io + Prisma · port 5000)
    └── /health                       ──▶  REST API
                                           │
                    MySQL 8 ◀── Sequelize ─┤
                    Redis 7 ◀─────────────┘
   Media  ──▶ Cloudinary
   Push   ──▶ FCM
   Errors ──▶ Sentry
   Metrics──▶ Prometheus + Grafana
```

### Tech Stack thực tế

| Thành phần | Công nghệ |
|:-----------|:----------|
| **Mobile** | React Native (Expo Router) |
| **REST API** | Node.js · Express · Sequelize · MySQL 8 |
| **Realtime** | Node.js · Socket.io · Prisma · Redis 7 |
| **Storage** | Cloudinary (ảnh/video) |
| **Deploy** | Docker · Docker Compose · GitHub Actions · VPS Ubuntu |
| **Monitoring** | Prometheus · Grafana · Loki · Alertmanager |

---

## Tính năng chính (Features)

### MVP — Core Journal & Group Feed
- Đăng ký / Đăng nhập (JWT Auth)
- Tạo, chỉnh sửa, xóa nhật ký cá nhân
- Đính kèm ảnh & video (upload Cloudinary)
- Xem nhật ký theo timeline
- Feed nhóm: xem, reaction, comment bài thành viên

### Time Capsule
- Soạn thư tương lai, thiết lập thời gian mở khóa
- Gửi capsule cho người dùng khác
- Thông báo tự động khi capsule mở (node-cron)
- Đồng hồ đếm ngược

### Mood Tracking
- Chọn & lưu trạng thái cảm xúc hằng ngày
- Biểu đồ xu hướng mood 30 ngày
- Gợi ý bài viết cũ theo cảm xúc hiện tại
- Tính năng "Ngày này năm xưa"

### Group Check-in
- Phiên check-in nhóm real-time (WebSocket)
- Chụp ảnh từ camera native để check-in
- Xem trạng thái online của thành viên

---

## Cài đặt & Chạy (Setup & Run)

### Yêu cầu
- Node.js 18+
- Docker & Docker Compose
- MySQL 8 (hoặc dùng Docker)

### Cách 1 — Docker (khuyến nghị)

```bash
git clone https://github.com/Hieusin18/NhatKi.git
cd NhatKi

cp deploy/.env.production.example deploy/.env.production
# Điền các biến: DB_*, JWT_SECRET, CLOUDINARY_*, MAP_API_KEY

cd deploy
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Migration & seed dữ liệu mẫu
docker compose -f docker-compose.prod.yml exec backend npm run migrate
docker compose -f docker-compose.prod.yml exec backend npm run seed

# Kiểm tra
curl http://localhost/health   # -> {"status":"ok"}
```

### Cách 2 — Chạy trực tiếp (không Docker)

**REST API (gốc repo):**
```bash
npm install
cp deploy/.env.production.example .env
npm run migrate && npm run seed
npm run dev   # nodemon src/app.js · port 4000
```

**Realtime service:**
```bash
cd backend
npm install
npm run dev   
```

**Mobile:**
```bash
cd mobile
npm install
npx expo start
```

### Biến môi trường
Xem [`deploy/.env.production.example`](./deploy/.env.production.example).
Bắt buộc: `DB_PASSWORD`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

---

## Kiểm thử (Testing)

```bash
# Unit tests (REST API)
npm test

# Smoke test sau khi chạy Docker
curl http://localhost/health
```

CI tự động chạy build → deploy → smoke-test `/health` khi push tag `v*`.
Xem kết quả: [GitHub Actions](https://github.com/Hieusin18/NhatKi/actions)

---

## Deploy Production

Xem hướng dẫn đầy đủ tại [`deploy/DEPLOYMENT.md`](./deploy/DEPLOYMENT.md).

**Tóm tắt:**
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
# GitHub Actions tự động: build image → push GHCR → SSH deploy → smoke-test
```

---

## Cấu trúc thư mục (Project Structure)

```text
NhatKi/
├── src/             
│   ├── app.js
│   ├── routes/
│   ├── models/
│   ├── middlewares/
│   └── migrations/
├── backend/         
│   └── app.js
├── mobile/          
│   ├── app/
│   └── src/
├── deploy/            
│   ├── docker-compose.prod.yml
│   ├── .env.production.example
│   ├── DEPLOYMENT.md
│   └── monitoring/
├── .github/
│   └── workflows/
│       └── deploy-prod.yml
├── SRS.md            
└── CHANGELOG.md
```

---

## Changelog

Xem [`CHANGELOG.md`](./CHANGELOG.md) để theo dõi lịch sử các phiên bản.

---

## Nhóm phát triển (Contributors)

| Vai trò | Thành viên |
|:--------|:-----------|
| Dev 1 — Backend Lead | [Hieusin18](https://github.com/Hieusin18) |
| Dev 2 — Backend | [hoangvu-ai] |
| Dev 3 — Mobile | [caohuongquynh] |
| Dev 4 — Mobile UI | [thanhnhe00] |
| Dev 5 — DevOps | [ngocanh-dev2209] |


