import { randomUUID } from 'node:crypto';
import redis from '../config/redis.js';

redis.defineCommand('releaseLockIfOwner', {
  numberOfKeys: 1,
  lua: `
    if redis.call('GET', KEYS[1]) == ARGV[1] then
      return redis.call('DEL', KEYS[1])
    else
      return 0
    end
  `,
});

redis.defineCommand('renewLockIfOwner', {
  numberOfKeys: 1,
  lua: `
    if redis.call('GET', KEYS[1]) == ARGV[1] then
      return redis.call('PEXPIRE', KEYS[1], ARGV[2])
    else
      return 0
    end
  `,
});

export class LockLostError extends Error {
  constructor(key) {
    super(`Lost ownership of lock: ${key}`);
    this.name = 'LockLostError';
  }
}

export async function acquireLock(key, ttlMs) {
  const token = randomUUID();
  const result = await redis.set(key, token, 'PX', ttlMs, 'NX');
  return result === 'OK' ? token : null;
}

export async function renewLock(key, token, ttlMs) {
  const result = await redis.renewLockIfOwner(key, token, ttlMs);
  return result === 1;
}

export async function releaseLock(key, token) {
  const result = await redis.releaseLockIfOwner(key, token);
  return result === 1;
}

export async function withLock(key, ttlMs, fn) {
  const token = await acquireLock(key, ttlMs);

  if (!token) {
    return { acquired: false };
  }

  let ownershipLost = false;

  // The moment past which we can no longer be certain we still hold the
  // lock, absent a new confirmed renewal. Set to one full renewal-interval
  // (ttlMs / 2) before the hard Redis-side expiry -- this lines up exactly
  // with when the NEXT renewal attempt is due to fire, so if that attempt
  // hasn't confirmed success by then, ownership is already uncertain, with
  // a full ttlMs/2 of real margin still remaining before Redis itself
  // would expire the key.
  let safeUntil = Date.now() + ttlMs / 2;

  const renewalTimer = setInterval(async () => {
    try {
      const renewed = await renewLock(key, token, ttlMs);
      if (renewed) {
        safeUntil = Date.now() + ttlMs / 2;
      } else {
        ownershipLost = true;
      }
    } catch {
      ownershipLost = true;
    }
  }, Math.floor(ttlMs / 2));

  const checkOwnership = () => {
    if (ownershipLost || Date.now() >= safeUntil) {
      throw new LockLostError(key);
    }
  };

  try {
    const result = await fn(checkOwnership);
    return { acquired: true, result };
  } finally {
    clearInterval(renewalTimer);
    await releaseLock(key, token);
  }
}