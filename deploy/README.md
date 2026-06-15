# Setlog — DevOps Tuần 4 (Dev 5: Fullstack/DevOps)

> Deploy production + Monitoring/Alerts + hướng dẫn chạy local cho **Setlog** (nhật ký + Time Capsule + Mood Tracking + Group Feed/Check-in).
> Thư mục này được thiết kế để đặt vào **`deploy/`** ở gốc repo.

## Kiến trúc & cách map với repo

Repo hiện có **2 tiến trình backend tách biệt** — bộ deploy này phản ánh đúng điều đó:

| Service | Vị trí repo | Vai trò | Cổng |
|---|---|---|---|
| `backend` (REST API) | gốc repo, entry `src/app.js` | Express + Sequelize + MySQL. Routes: `/auth` `/groups` `/diary` `/feed` `/tags` `/capsules` | 4000 |
| `realtime` | `backend/`, entry `app.js` | Socket.io + node-cron (Time Capsule) + `/api/v1/media` | 5000 |

```text
   Mobile App ─▶ Nginx (TLS, rate-limit)
                  ├── /socket.io/, /api/v1/media  ─▶ realtime (5000)
                  ├── /health                     ─▶ backend  (4000)
                  └── /auth /diary /feed ...       ─▶ backend  (4000)
                                                      │
                          MySQL 8 ◀── Sequelize ─────┤
                          Redis 7 ◀──────────────────┘
   media ─▶ Cloudinary   push ─▶ FCM   bản đồ ─▶ Map API   lỗi ─▶ Sentry
```

> Lưu ý: hai app đang dùng ORM khác nhau (REST dùng Sequelize/MySQL, realtime dùng Prisma). Khuyến nghị nhóm thống nhất 1 DB/ORM ở các vòng sau; bộ deploy vẫn chạy được với cả hai.

## Đặt thư mục vào repo

```text
<repo gốc>/
├── package.json            # diary-backend (REST)
├── src/                     # REST API
│   ├── app.js
│   └── middlewares/observability.js   # << copy từ deploy/api/src/middlewares/
├── backend/                 # realtime/media app (Socket.io, Prisma)
│   └── app.js
└── deploy/                  # << đặt toàn bộ thư mục này vào đây
    ├── docker-compose.prod.yml
    ├── .env.production.example
    ├── api/Dockerfile               # build context = repo gốc
    ├── realtime/Dockerfile          # build context = repo backend/
    ├── nginx/setlog.conf
    ├── monitoring/...
    ├── scripts/...
    └── .github/  (workflow nên đặt ở <repo gốc>/.github/workflows/)
```

## Chạy local nhanh (Docker)

```bash
cp deploy/.env.production.example deploy/.env.production
# sửa tối thiểu: DB_*, JWT_SECRET, CLOUDINARY_*, MAP_API_KEY

cd deploy
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Migration + seed (chạy trong service REST)
docker compose -f docker-compose.prod.yml exec backend npm run migrate
docker compose -f docker-compose.prod.yml exec backend npm run seed

curl http://localhost/health        # -> {"status":"ok",...}
```

REST API: `http://localhost/` (vd `POST /auth/login`) · WebSocket: `ws://localhost/socket.io/` · Media: `POST /api/v1/media/upload`

### Chạy REST API trực tiếp (không Docker)

```bash
# tại gốc repo
npm install && npm i prom-client
cp deploy/.env.production.example .env   # đổi DB_HOST=127.0.0.1
npm run migrate && npm run seed
npm run dev    # nodemon src/app.js
```

## Tích hợp observability (bắt buộc để có /health và /metrics)

1. Copy `deploy/api/src/middlewares/observability.js` → `src/middlewares/observability.js`
2. Cài: `npm i prom-client`
3. Sửa `src/app.js` (đặt **trước** các `app.use('/auth'...)`):

```js
require('dotenv').config();
const express       = require('express');
const { sequelize } = require('./models/index');

const app = express();
app.use(express.json());

// CORS ... (giữ nguyên)

require('./middlewares/observability')(app, sequelize);   // << THÊM DÒNG NÀY

// Routes
app.use('/auth',   require('./routes/auth'));
// ... phần còn lại giữ nguyên
```

Sau đó `GET /health` trả 200 (có kiểm tra DB) và `GET /metrics` phục vụ Prometheus (đã chặn public qua Nginx).

## Biến môi trường

Xem [`.env.production.example`](./.env.production.example). Bắt buộc: `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `JWT_SECRET`, `CLOUDINARY_*`, `MAP_API_KEY`. Khuyến nghị: `SENTRY_DSN`, `ALERT_SLACK_WEBHOOK`.

## Scripts

| Lệnh | Mô tả |
|---|---|
| `./scripts/deploy.sh` | Pull image → backup → migrate → restart → healthcheck → rollback nếu fail |
| `./scripts/backup-db.sh` | Dump MySQL, nén gzip, giữ 7 ngày (khớp Admin Backup & Restore) |
| `npm run migrate` / `npm run seed` | Migration / data mẫu (service `backend`) |

## Monitoring & Alerts

```bash
cd deploy
docker compose -f monitoring/docker-compose.monitoring.yml --env-file .env.production up -d
```

- **Grafana** `http://localhost:3000` (login theo `GRAFANA_ADMIN_*`). Datasource Prometheus + Loki và dashboard **"Setlog - API Overview"** tự nạp sẵn (request rate, error 5xx, p95 latency, CPU/RAM, logs).
- **Logs**: Promtail gom log mọi container → Loki; lọc theo biến `container` trong dashboard hoặc Explore.
- **Alerts**: rule ở `monitoring/prometheus/alert.rules.yml` → Alertmanager → Slack `#setlog-alerts`. Gồm: BackendDown, lỗi 5xx>5%, p95>1s, CPU>85%, RAM>90%, đĩa<15%.

## Deploy production

Chi tiết: **[DEPLOYMENT.md](./DEPLOYMENT.md)**. Tóm tắt: push tag `v*` → GitHub Actions build & push 2 image (api + realtime) → SSH chạy `deploy.sh` → smoke-test `/health`.
