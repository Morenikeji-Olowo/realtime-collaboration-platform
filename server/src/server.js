import http from 'node:http';

import app from './app.js';
import { env } from './config/env.js';
import redis from './config/redis.js';

export async function createServer() {
  const httpServer = http.createServer(app);

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