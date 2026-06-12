# =========================================================
# Setlog Realtime/Media service - production Dockerfile
# Tương ứng thư mục repo: backend/  (Socket.io + node-cron + media upload)
# Build context: thư mục backend/ của repo
# =========================================================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force
# Prisma cần generate client (app này dùng Prisma)
COPY prisma ./prisma
RUN npx prisma generate || true

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=5000
RUN apk add --no-cache curl \
 && addgroup -g 1001 -S nodejs \
 && adduser -u 1001 -S setlog -G nodejs
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=setlog:nodejs . .
USER setlog
EXPOSE 5000
# Dùng endpoint engine.io của Socket.io để kiểm tra server còn sống
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS "http://localhost:5000/socket.io/?EIO=4&transport=polling" || exit 1
CMD ["node", "app.js"]
