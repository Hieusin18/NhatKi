// =========================================================
// Setlog API - Observability middleware
// Vị trí thật trong repo: src/middlewares/observability.js
// Cung cấp: GET /metrics (Prometheus) và GET /health (Docker/Nginx/CD)
// Cài thư viện: npm i prom-client
//
// TÍCH HỢP vào src/app.js (xem patch ở README mục "Tích hợp observability"):
//   const { sequelize } = require('./models/index');
//   require('./middlewares/observability')(app, sequelize);  // đặt TRƯỚC các app.use('/auth'...)
// =========================================================
const client = require('prom-client');

module.exports = function observability(app, sequelize) {
  const register = new client.Registry();
  client.collectDefaultMetrics({ register }); // CPU, RAM, event loop của Node

  const httpRequests = new client.Counter({
    name: 'http_requests_total',
    help: 'Tổng số HTTP request',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
  });

  const httpDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Thời gian xử lý HTTP request (giây)',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [register],
  });

  // Đo mỗi request
  app.use((req, res, next) => {
    const end = httpDuration.startTimer();
    res.on('finish', () => {
      // routes của repo: /auth, /diary, /feed, /tags, /groups, /capsules
      const route = req.route ? (req.baseUrl || '') + req.route.path : req.path;
      const labels = { method: req.method, route, status: res.statusCode };
      httpRequests.inc(labels);
      end(labels);
    });
    next();
  });

  // Healthcheck có kiểm tra DB (Sequelize)
  app.get('/health', async (req, res) => {
    try {
      if (sequelize) await sequelize.authenticate();
      res.status(200).json({ status: 'ok', uptime: process.uptime() });
    } catch (err) {
      res.status(503).json({ status: 'degraded', error: 'db_unreachable' });
    }
  });

  // Endpoint Prometheus scrape
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
};
