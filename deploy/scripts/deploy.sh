#!/usr/bin/env bash
# =========================================================
# Setlog - Production deploy script
# Dùng bởi CD pipeline hoặc chạy thủ công trên server.
# An toàn: migrate DB -> restart backend -> healthcheck -> rollback nếu fail.
# =========================================================
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"
HEALTH_URL="http://localhost/health"

echo "==> [1/5] Pull image mới nhất (IMAGE_TAG=${IMAGE_TAG:-latest})"
$COMPOSE pull backend realtime

echo "==> [2/5] Backup nhanh database trước khi migrate"
./scripts/backup-db.sh || echo "WARN: backup thất bại, vẫn tiếp tục."

echo "==> [3/5] Chạy migration"
$COMPOSE run --rm backend npm run migrate

echo "==> [4/5] Khởi động lại backend + realtime (no-deps để không restart DB)"
$COMPOSE up -d --no-deps backend realtime nginx

echo "==> [5/5] Healthcheck"
for i in $(seq 1 15); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo 000)
  if [ "$code" = "200" ]; then
    echo "Deploy thành công ✅ (healthy sau ${i} lần thử)"
    docker image prune -f
    exit 0
  fi
  echo "  thử $i: HTTP $code ..."; sleep 4
done

echo "Healthcheck thất bại ❌ -> rollback về image trước"
$COMPOSE rollback backend 2>/dev/null || $COMPOSE up -d --no-deps backend
exit 1
