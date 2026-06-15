# DEPLOYMENT — Runbook Production (Setlog)

Hướng dẫn đưa hệ thống lên **production live**. Đối tượng: Dev 5 (DevOps) và người trực vận hành.

---

## 1. Chuẩn bị server

VPS Ubuntu 22.04+, tối thiểu 2 vCPU / 4GB RAM / 40GB SSD.

```bash
# Cài Docker + Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # logout/login lại

# Thư mục triển khai
sudo mkdir -p /opt/setlog && sudo chown $USER /opt/setlog
git clone <repo-url> /opt/setlog
cd /opt/setlog/deploy
```

Mở firewall 80/443:
```bash
sudo ufw allow 80,443/tcp && sudo ufw enable
```

## 2. Cấu hình secrets

```bash
cp .env.production.example .env.production   # trong thư mục deploy/
nano .env.production   # điền DB_*, JWT_SECRET, CLOUDINARY_*, FCM_*, SENTRY_DSN, ALERT_SLACK_WEBHOOK
chmod 600 .env.production
```

> Không commit `.env.production`. Trên CI, các secret đặt trong GitHub Environments
> (`PROD_HOST`, `PROD_USER`, `PROD_SSH_KEY`, `GHCR_TOKEN`).

## 3. Chứng chỉ TLS (Let's Encrypt)

```bash
sudo apt install certbot -y
sudo certbot certonly --standalone -d api.setlog.app
# Trỏ cert vào nginx/certs
mkdir -p nginx/certs
sudo cp /etc/letsencrypt/live/api.setlog.app/fullchain.pem nginx/certs/
sudo cp /etc/letsencrypt/live/api.setlog.app/privkey.pem  nginx/certs/
```

Tự gia hạn (cron):
```bash
0 3 * * 1 certbot renew --quiet && docker compose -f /opt/setlog/deploy/docker-compose.prod.yml restart nginx
```

## 4. Lần deploy đầu tiên

```bash
cd /opt/setlog/deploy
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml exec backend npm run migrate
docker compose -f docker-compose.prod.yml exec backend npm run seed   # nếu cần data demo

# Bật monitoring
docker compose -f monitoring/docker-compose.monitoring.yml --env-file .env.production up -d

# Xác nhận
curl https://api.setlog.app/health
```

## 5. Deploy tự động (CD)

Pipeline `.github/workflows/deploy-prod.yml` chạy khi:
- Push tag `v*` (vd `git tag v1.0.0 && git push --tags`), hoặc
- Bấm **Run workflow** thủ công.

Luồng: **build & push image (GHCR)** → **SSH vào server chạy `deploy.sh`** → **smoke-test `/health`**.
`deploy.sh` tự backup DB, migrate, restart rolling, healthcheck và **rollback** nếu fail.

## 6. Backup & Restore

Đặt cron backup hằng ngày:
```bash
0 2 * * * cd /opt/setlog/deploy && ./scripts/backup-db.sh >> /var/log/setlog-backup.log 2>&1
```

Restore:
```bash
gunzip < backups/setlog_YYYYMMDD_HHMMSS.sql.gz | \
docker compose -f docker-compose.prod.yml exec -T mysql \
mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME"
```

## 7. Rollback thủ công

```bash
export IMAGE_TAG=<tag-cũ-ổn-định>
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --no-deps backend
curl https://api.setlog.app/health
```

## 8. Quan sát & xử lý sự cố

| Việc | Lệnh / nơi xem |
|---|---|
| Log realtime 1 service | `docker compose -f docker-compose.prod.yml logs -f backend` |
| Log tập trung + tìm kiếm | Grafana → Explore → datasource **Loki** |
| Metrics & dashboard | Grafana `http://<host>:3000` |
| Cảnh báo | kênh Slack `#setlog-alerts` (Alertmanager) |
| Lỗi ứng dụng chi tiết | Sentry (DSN trong env) |
| Tài nguyên container | cAdvisor qua Prometheus |

## 9. Checklist go-live

- [ ] `.env.production` đầy đủ, `chmod 600`, không nằm trong git
- [ ] TLS hợp lệ, HTTP redirect sang HTTPS
- [ ] `/health` trả 200; migration đã chạy
- [ ] Monitoring stack chạy; Grafana thấy metrics backend
- [ ] Bắn thử 1 alert (tắt backend) → có thông báo Slack
- [ ] Cron backup + cron gia hạn cert đã đặt
- [ ] CD pipeline chạy thử thành công 1 lần
- [ ] Sentry nhận được sự kiện test
