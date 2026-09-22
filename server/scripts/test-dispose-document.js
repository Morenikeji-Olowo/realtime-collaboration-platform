import 'dotenv/config';
import * as Y from 'yjs';
import {
  getOrCreateDocument,
  getDocumentState,
  applyUpdate,
  markPersistedIfCurrent,
  addParticipant,
  removeParticipant,
  disposeDocument,
  getDocument,
} from '../src/services/yjs.service.js';

const DOCUMENT_ID = 'b5097f47-3eea-4df3-891d-2bb9b3f60f11';
const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

function makeRealUpdate(text) {
  const doc = new Y.Doc();
  doc.getText('content').insert(0, text);
  return Y.encodeStateAsUpdate(doc);
}

console.log('State 1 — unknown doc:', disposeDocument(UNKNOWN_ID));

await getOrCreateDocument(DOCUMENT_ID);
addParticipant(DOCUMENT_ID);
console.log('State 2 — has participant:', disposeDocument(DOCUMENT_ID));

removeParticipant(DOCUMENT_ID); // 1 -> 0

try {
  removeParticipant(DOCUMENT_ID); // already at 0, document still loaded
  console.log('UNEXPECTED: did not throw at zero participants');
} catch (err) {
  console.log('Correctly rejected (zero participants, still loaded):', err.message);
}
applyUpdate(DOCUMENT_ID, makeRealUpdate('unsaved change'));
console.log('State before dispose (should be dirty):', getDocumentState(DOCUMENT_ID));
console.log('State 3 — zero participants + dirty:', disposeDocument(DOCUMENT_ID));

markPersistedIfCurrent(DOCUMENT_ID, getDocumentState(DOCUMENT_ID).revision);
console.log('State before dispose (should be clean):', getDocumentState(DOCUMENT_ID));
console.log('State 4 — zero participants + clean:', disposeDocument(DOCUMENT_ID));

console.log('getDocument() after disposal:', getDocument(DOCUMENT_ID));

try {
  removeParticipant(DOCUMENT_ID);
  console.log('UNEXPECTED: did not throw');
} catch (err) {
  console.log('Correctly rejected (not loaded):', err.message);
}

process.exit(0);