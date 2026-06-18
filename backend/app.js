const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { SocketHandler } = require('./realtime/socket.handler');
const mediaRouter = require('./modules/media/media.routes');
const authRouter = require('./modules/auth/auth.routes');
const groupRouter = require('./modules/groups/group.routes');
const { initCapsuleScheduler } = require('./modules/capsule/capsule.scheduler');

dotenv.config();
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/media', mediaRouter);
app.use('/api/media', mediaRouter);
app.use('/api/groups', groupRouter);

// Initialize Socket.io Server
const socketHandler = SocketHandler.getInstance();
socketHandler.init(server);

// Initialize Time Capsule Cron Job
initCapsuleScheduler();

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
