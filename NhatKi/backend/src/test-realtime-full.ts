import jwt from 'jsonwebtoken';
import { io, Socket } from 'socket.io-client';

const secret = process.env.JWT_SECRET || 'supersecretkey';

// Tạo token hợp lệ cho 2 người dùng
const token1 = jwt.sign(
  { user_id: 'user_01', username: 'User One', group_id: 'group_04' },
  secret
);
const token2 = jwt.sign(
  { user_id: 'user_02', username: 'User Two', group_id: 'group_04' },
  secret
);

// === ĐOẠN CODE IN TOKEN CHUẨN ĐỂ BẠN COPY ===
console.log('\n==================================================================');
console.log('👉 CHUỖI TOKEN XỊN USER 1 (COPY DÁN VÀO WEB):');
console.log(`Bearer ${token1}`);
console.log('==================================================================\n');

console.log('[Test] Starting comprehensive realtime validation test...');

let socket1: Socket;
let socket2: Socket;
let disconnectTime: number = 0;

const connectUser1 = () => {
  return new Promise<void>((resolve) => {
    socket1 = io('http://localhost:5000', {
      auth: { token: `Bearer ${token1}` },
      transports: ['websocket']
    });

    socket1.on('connect', () => {
      console.log(`[Test] User 1 (user_01) connected. Socket ID: ${socket1.id}`);
      resolve();
    });

    socket1.on('presence:list', (data) => {
      console.log('[Test] User 1 received "presence:list":', JSON.stringify(data, null, 2));
    });

    socket1.on('presence:online', (data) => {
      console.log('[Test] User 1 received "presence:online" event:', data);
    });

    socket1.on('presence:offline', (data) => {
      const now = Date.now();
      console.log('[Test] User 1 received "presence:offline" event:', data);
      if (data.user_id === 'user_02') {
        const diffSeconds = ((now - disconnectTime) / 1000).toFixed(2);
        console.log(`[Test] User 2 went offline. Delay from disconnect: ${diffSeconds}s`);
        const isValid = parseFloat(diffSeconds) >= 4.8 && parseFloat(diffSeconds) <= 5.5;
        console.log(`[Test] Grace Period (5s) validation: ${isValid ? 'SUCCESS' : 'FAILED'}`);

        socket1.disconnect();
        process.exit(isValid ? 0 : 1);
      }
    });
  });
};

const connectUser2 = () => {
  return new Promise<void>((resolve) => {
    socket2 = io('http://localhost:5000', {
      auth: { token: `Bearer ${token2}` },
      transports: ['websocket']
    });

    socket2.on('connect', () => {
      console.log(`[Test] User 2 (user_02) connected. Socket ID: ${socket2.id}`);
      resolve();
    });
  });
};

const run = async () => {
  try {
    await connectUser1();
    await connectUser2();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('[Test] User 1 is requesting the online list...');
    socket1.emit('presence:get_list');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log('[Test] User 2 is disconnecting now...');
    disconnectTime = Date.now();
    socket2.disconnect();
    console.log('[Test] Waiting for Grace Period (5s) to expire...');
  } catch (err) {
    console.error('[Test] Error occurred:', err);
    process.exit(1);
  }
};

run();