import 'dotenv/config';
import * as Y from 'yjs';
import { getOrCreateDocument, applyUpdate, getDocumentState, markPersistedIfCurrent } from '../src/services/yjs.service.js';

const DOCUMENT_ID = 'b5097f47-3eea-4df3-891d-2bb9b3f60f11';

function makeRealUpdate(text) {
  const doc = new Y.Doc();
  doc.getText('content').insert(0, text);
  return Y.encodeStateAsUpdate(doc);
}

await getOrCreateDocument(DOCUMENT_ID);

console.log('Initial:', getDocumentState(DOCUMENT_ID));
// expect revision: 0, lastPersistedRevision: 0, dirty: false

applyUpdate(DOCUMENT_ID, makeRealUpdate('first change'));
console.log('After 1st update:', getDocumentState(DOCUMENT_ID));
// expect revision: 1, lastPersistedRevision: 0, dirty: true

const cleared = markPersistedIfCurrent(DOCUMENT_ID, 1);
console.log('markPersistedIfCurrent(1) returned:', cleared);
console.log('After clean flush:', getDocumentState(DOCUMENT_ID));
// expect revision: 1, lastPersistedRevision: 1, dirty: false

applyUpdate(DOCUMENT_ID, makeRealUpdate('second change'));
console.log('After 2nd update:', getDocumentState(DOCUMENT_ID));
// expect revision: 2, lastPersistedRevision: 1, dirty: true

const staleCleared = markPersistedIfCurrent(DOCUMENT_ID, 1); // THE critical case
console.log('markPersistedIfCurrent(1) [STALE] returned:', staleCleared);
console.log('After stale flush attempt:', getDocumentState(DOCUMENT_ID));
// expect revision: 2, lastPersistedRevision: 1, dirty: true -- unchanged, correctly rejected

process.exit(0);