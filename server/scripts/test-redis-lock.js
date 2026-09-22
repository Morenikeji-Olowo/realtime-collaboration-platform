import 'dotenv/config';
import { acquireLock, renewLock, releaseLock, withLock, LockLostError } from '../src/utils/redisLock.js';
import redis from '../src/config/redis.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const KEY = 'test:lock:document-abc';

async function cleanup() {
  await redis.del(KEY);
}

async function test1_basicAcquireRelease() {
  console.log('\n--- Test 1: basic acquire, blocked re-acquire, release, re-acquire ---');
  const tokenA = await acquireLock(KEY, 1000);
  console.log('First acquire returned a token?', tokenA !== null);

  const tokenB = await acquireLock(KEY, 1000);
  console.log('Second acquire while held returns null?', tokenB === null);

  const released = await releaseLock(KEY, tokenA);
  console.log('Release with correct token returns true?', released === true);

  const tokenC = await acquireLock(KEY, 1000);
  console.log('Acquire after release succeeds?', tokenC !== null);

  await releaseLock(KEY, tokenC);
}

async function test2_ownershipSafeRelease() {
  console.log('\n--- Test 2: wrong token cannot release someone else\'s lock ---');
  const tokenA = await acquireLock(KEY, 1000);

  const releasedByImpostor = await releaseLock(KEY, 'wrong-token');
  console.log('Release with WRONG token returns false?', releasedByImpostor === false);

  const stillHeld = await acquireLock(KEY, 1000);
  console.log('Lock is still held by A (re-acquire fails)?', stillHeld === null);

  await releaseLock(KEY, tokenA);
}

async function test3_renewal() {
  console.log('\n--- Test 3: renewal succeeds for owner, fails for impostor ---');
  const tokenA = await acquireLock(KEY, 1000);

  const renewedCorrectly = await renewLock(KEY, tokenA, 1000);
  console.log('Renew with correct token returns true?', renewedCorrectly === true);

  const renewedByImpostor = await renewLock(KEY, 'wrong-token', 1000);
  console.log('Renew with WRONG token returns false?', renewedByImpostor === false);

  await releaseLock(KEY, tokenA);
}

async function test4_withLockHappyPath() {
  console.log('\n--- Test 4: withLock, operation outlasts multiple renewal cycles cleanly ---');
  const { acquired, result } = await withLock(KEY, 1000, async (checkOwnership) => {
    await sleep(1200); // longer than 2 renewal intervals (500ms each) at a 1000ms TTL
    checkOwnership(); // should NOT throw -- renewal should have kept the lease alive
    return 'completed';
  });

  console.log('Lock acquired?', acquired === true);
  console.log('Operation completed normally?', result === 'completed');

  const nowFree = await acquireLock(KEY, 1000);
  console.log('Lock correctly released after withLock finished?', nowFree !== null);
  await releaseLock(KEY, nowFree);
}

async function test5_ownershipLossDetected() {
  console.log('\n--- Test 5: THE critical case -- simulated takeover mid-operation ---');
  let caughtLockLost = false;

  try {
    await withLock(KEY, 1000, async (checkOwnership) => {
      await sleep(200);
      // Simulate another instance forcibly taking the lock -- direct Redis
      // write, bypassing our own token entirely
      await redis.set(KEY, 'impostor-token', 'PX', 1000);
      await sleep(600); // past the 500ms renewal interval -- should detect loss
      checkOwnership(); // must throw here
      console.log('UNEXPECTED: reached past checkOwnership without throwing');
    });
  } catch (err) {
    caughtLockLost = err instanceof LockLostError;
  }

  console.log('LockLostError correctly thrown?', caughtLockLost);

  const impostorStillHolds = await redis.get(KEY);
  console.log('Impostor\'s lock entry left untouched (our release correctly no-op\'d)?', impostorStillHolds === 'impostor-token');

  await redis.del(KEY); // manual cleanup, since it's not ours to release
}

await cleanup();
await test1_basicAcquireRelease();
await test2_ownershipSafeRelease();
await test3_renewal();
await test4_withLockHappyPath();
await test5_ownershipLossDetected();
await cleanup();

console.log('\nAll tests complete.');
process.exit(0);