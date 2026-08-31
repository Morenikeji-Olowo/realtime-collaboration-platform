import http from 'node:http';

import app from './app.js';
import { env } from './config/env.js';
import redis from './config/redis.js';

import { createAdapter } from '@socket.io/redis-streams-adapter';
import { Server } from 'socket.io';
import socketRedis from './config/socketRedis.js';
import { verifyToken } from './utils/jwt.js';
import { registerConnectionHandler } from './socket/connection.js';

export async function createServer() {
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    adapter: createAdapter(socketRedis),
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if(!token){
      return next(new Error('Missing authentication token'));
    }

    try{
      socket.user = await verifyToken(token);
      next();
    }
    catch(err){
      console.error('Socket auth failed:', err.message, err.code);
      next(new Error('Invalid or expired token'));
    }
  });

  registerConnectionHandler(io);

  function start() {
    httpServer.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  }

  async function shutdown(signal) {
    console.log(`${signal} received, shutting down gracefully...`);

    const forceExitTimer = setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);

    io.close();

    await new Promise((resolve) => {
      httpServer.close(() => resolve());
    });
    console.log('HTTP server closed');

    await redis.quit();
    console.log('Redis connection closed');

    clearTimeout(forceExitTimer);
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return { start };
}