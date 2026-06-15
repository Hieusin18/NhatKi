require('dotenv').config();
const express = require('express');
const { sequelize } = require('./models/index');

const app = express();

app.use(express.json());
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/', (req, res) => res.json({ message: '📔 Diary API is running!' }));
app.use('/auth', require('./routes/auth'));
app.use('/groups', require('./routes/groups'));
app.use('/diary', require('./routes/diary'));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error.' });
});

// Chỉ listen khi không phải môi trường test
if (process.env.NODE_ENV !== 'test') {
  async function start() {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected!');
      app.listen(process.env.PORT || 3000, () => {
        console.log(`🚀 Server running at http://localhost:${process.env.PORT || 3000}`);
      });
    } catch (err) {
      console.error('❌ Cannot connect to database:', err.message);
      process.exit(1);
    }
  }
  start();
}

module.exports = app;