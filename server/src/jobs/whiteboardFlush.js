import { flushAllDirty } from '../services/whiteboard.service.js';

const FLUSH_INTERVAL_MS = 5000;
let intervalId = null;

export function startWhiteboardFlush() {
  intervalId = setInterval(() => {
    flushAllDirty().catch((err) => {
      console.error('Whiteboard flush cycle failed:', err);
    });
  }, FLUSH_INTERVAL_MS);
}

export function stopWhiteboardFlush() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}