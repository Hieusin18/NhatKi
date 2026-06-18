const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { createServer } = require('http');
const { SocketHandler } = require('./realtime/socket.handler');
const mediaRouter = require('./modules/media/media.routes');
const authRouter = require('./modules/auth/auth.routes');
const groupRouter = require('./modules/groups/group.routes');
const { initCapsuleScheduler } = require('./modules/capsule/capsule.scheduler');
const { globalLimiter, strictLimiter } = require('./middlewares/rateLimiter');

dotenv.config();
const app = express();

// Security middlewares at the top of the stack
app.use(helmet());
app.use(globalLimiter);

const server = createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Apply strict rate limiter to login routes
app.use('/api/v1/auth/login', strictLimiter);
app.use('/api/auth/login', strictLimiter);

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/media', mediaRouter);
app.use('/api/media', mediaRouter);
app.use('/api/groups', groupRouter);
const socketHandler = SocketHandler.getInstance();
socketHandler.init(server);

// Initialize Time Capsule Cron Job
initCapsuleScheduler();

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, server };
