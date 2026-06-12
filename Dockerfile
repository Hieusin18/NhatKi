# =========================================================
# Setlog REST API - Production Dockerfile (multi-stage)
# Node.js / Express + MySQL (Sequelize). Entry: src/app.js
# Build context: THƯ MỤC GỐC repo (chứa package.json + src/)
# =========================================================

# ---------- Stage 1: dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app
# Chỉ copy lockfile để tận dụng cache layer
COPY package.json package-lock.json* ./
# Cài đúng dependencies production (bỏ devDependencies)
RUN npm ci --omit=dev && npm cache clean --force

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

# Biến môi trường mặc định
ENV NODE_ENV=production \
    PORT=4000

# Cài curl để phục vụ HEALTHCHECK
RUN apk add --no-cache curl

# Tạo user không phải root để chạy app (bảo mật)
RUN addgroup -g 1001 -S nodejs \
 && adduser  -u 1001 -S setlog -G nodejs

# Copy node_modules đã build sẵn + source code
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=setlog:nodejs . .

# Quyền tối thiểu
USER setlog

EXPOSE 4000

# Healthcheck: backend phải expose GET /health (xem README)
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://localhost:4000/health || exit 1

# Chạy migration + start (entrypoint xử lý migrate trước khi start)
CMD ["node", "src/app.js"]
