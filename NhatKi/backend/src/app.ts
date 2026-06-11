import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { SocketHandler } from './realtime/socket.handler';
import mediaRouter from './modules/media/media.routes';

dotenv.config();
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/media', mediaRouter);

// Initialize Socket.io Server
const socketHandler = SocketHandler.getInstance();
socketHandler.init(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
