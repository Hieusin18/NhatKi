#!/usr/bin/env bash
# =========================================================
# Setlog - Database backup (mysqldump) + xoay vòng 7 ngày
# Khớp yêu cầu Admin Panel: "thiết lập tự động Backup & Restore dữ liệu".
# Đặt cron: 0 2 * * *  /opt/setlog/scripts/backup-db.sh
# =========================================================
set -euo pipefail

source .env.production 2>/dev/null || true
BACKUP_DIR="./backups"
STAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/setlog_${STAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "==> Dump database ${DB_NAME} -> ${FILE}"
docker compose -f docker-compose.prod.yml exec -T mysql \
  mysqldump -u root -p"${DB_ROOT_PASSWORD}" --single-transaction --quick "${DB_NAME}" \
  | gzip > "$FILE"

echo "==> Xoá backup cũ hơn 7 ngày"
find "$BACKUP_DIR" -name "setlog_*.sql.gz" -mtime +7 -delete

echo "Backup xong ✅ ($(du -h "$FILE" | cut -f1))"

# Khôi phục (tham khảo):
#   gunzip < backups/setlog_YYYYMMDD_HHMMSS.sql.gz | \
#   docker compose -f docker-compose.prod.yml exec -T mysql \
#   mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME"
