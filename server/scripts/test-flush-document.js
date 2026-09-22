import 'dotenv/config';
import * as Y from 'yjs';
import { randomUUID } from 'node:crypto';
import supabase from '../src/config/supabase.js';
import { getOrCreateDocument, applyUpdate, flushDocument } from '../src/services/yjs.service.js';
import { withLock } from '../src/utils/redisLock.js';
import { acquireLock, releaseLock } from '../src/utils/redisLock.js';

function hexByteaToUint8Array(hexBytea) {
  if (!hexBytea || hexBytea === '\\x') return new Uint8Array(0);
  const hex = hexBytea.startsWith('\\x') ? hexBytea.slice(2) : hexBytea;
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

function encodeAsHexBytea(uint8arr) {
  return '\\x' + Buffer.from(uint8arr).toString('hex');
}

async function createTestDocument() {
  // Reuses the real workspace from earlier testing
  const res = await fetch('http://localhost:3000/api/workspaces/1fa40af6-3d83-4696-8387-2467e73731ad/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.TEST_TOKEN}` },
    body: JSON.stringify({ title: 'Flush test doc' }),
  });
  const { data } = await res.json();
  return data.id;
}

async function test1_realMerge(documentId) {
  console.log('\n--- Test 1: real merge, Postgres A + local B -> Postgres A+B ---');

  // Simulate a pre-existing persisted snapshot "A" -- written directly, bypassing our service
  const seedDoc = new Y.Doc();
  seedDoc.getText('content').insert(0, 'AAA-');
  const seedUpdate = Y.encodeStateAsUpdate(seedDoc);

  await supabase.from('documents').update({ content: encodeAsHexBytea(seedUpdate) }).eq('id', documentId);

  // Load it through our real service -- confirms A gets loaded correctly
  const doc = await getOrCreateDocument(documentId);
  console.log('Loaded content after seeding A:', doc.getText('content').toString());

  // Apply a genuinely separate local edit "B"
  const editDoc = new Y.Doc();
  editDoc.getText('content').insert(0, 'BBB');
  applyUpdate(documentId, Y.encodeStateAsUpdate(editDoc));

  const flushResult = await flushDocument(documentId);
  console.log('Flush result:', flushResult);

  // Re-read directly from Postgres, completely independent of our in-memory cache
  const { data } = await supabase.from('documents').select('content').eq('id', documentId).single();
  const verifyDoc = new Y.Doc();
  Y.applyUpdate(verifyDoc, hexByteaToUint8Array(data.content));
  const finalContent = verifyDoc.getText('content').toString();

  console.log('Final Postgres content:', finalContent);
  console.log('Contains A?', finalContent.includes('AAA-'));
  console.log('Contains B?', finalContent.includes('BBB'));
}

async function test2_lockUnavailable(documentId) {
  console.log('\n--- Test 2: lock already held -- flush must not touch Postgres ---');

  const { data: before } = await supabase.from('documents').select('content').eq('id', documentId).single();

  const lockKey = `document:${documentId}:flush-lock`;
  const impostorToken = await acquireLock(lockKey, 5000);
  console.log('Impostor holds the lock?', impostorToken !== null);

  const result = await flushDocument(documentId);
  console.log('flushDocument() result while locked:', result);

  const { data: after } = await supabase.from('documents').select('content').eq('id', documentId).single();
  console.log('Postgres content unchanged?', before.content === after.content);

  await releaseLock(lockKey, impostorToken);
}

const documentId = await createTestDocument();
console.log('Testing against document:', documentId);

await test1_realMerge(documentId);
await test2_lockUnavailable(documentId);

process.exit(0);