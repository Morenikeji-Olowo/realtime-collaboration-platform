import { io } from 'socket.io-client';
import Redis from 'ioredis';

const TOKEN = 'PASTE_A_FRESH_TOKEN';
const redis = new Redis('redis://localhost:6379');

const socket = io('http://localhost:3000', { auth: { token: TOKEN } });
let attempted = false;

socket.on('connect', async () => {
  if (!attempted) {
    attempted = true;
    console.log('Initial connect. Socket ID:', socket.id);
    console.log('Forcing abrupt close in 1s...');
    setTimeout(() => socket.io.engine.close(), 1000);
    return;
  }

  console.log('\nReconnected. Socket ID:', socket.id);
  console.log('Recovered?', socket.recovered);
  console.log('\n' + (socket.recovered ? 'PASS' : 'FAIL'));

  await redis.quit();
  process.exit(socket.recovered ? 0 : 1);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});