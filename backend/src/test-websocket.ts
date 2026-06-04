import jwt from 'jsonwebtoken';
import { io } from 'socket.io-client';

const secret = process.env.JWT_SECRET || 'supersecretkey';
const payload = {
  user_id: 'user_dev2_99',
  username: 'Dev 2 Tester',
  group_id: 'group_cnpm_04'
};

// 1. Generate JWT Token
const token = jwt.sign(payload, secret);
console.log('[Test] 1. Generated JWT Token:', token);

// 2. Connect to local WebSocket server
console.log('[Test] 2. Connecting to WebSocket server at ws://localhost:5000...');
const socket = io('http://localhost:5000', {
  auth: {
    token: `Bearer ${token}`
  },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log(`[Test] [Client] Connected successfully! Socket ID: ${socket.id}`);
});

socket.on('connect_error', (error) => {
  console.error('[Test] [Client] Connection failed:', error.message);
  process.exit(1);
});

// 3. Listen to the room:joined event emitted by the server
socket.on('room:joined', (data) => {
  console.log('[Test] [Client] Received "room:joined" event from server:', data);
  console.log('[Test] Handshake & Room Allocation: SUCCESSFUL!');
  socket.disconnect();
  process.exit(0);
});

// Timeout fail-safe
setTimeout(() => {
  console.error('[Test] [Client] Timeout: Did not receive "room:joined" event from server within 5s.');
  socket.disconnect();
  process.exit(1);
}, 5000);
