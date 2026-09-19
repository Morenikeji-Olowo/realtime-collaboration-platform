import 'dotenv/config';
import * as Y from 'yjs';
import { getOrCreateDocument, applyUpdate } from '../src/services/yjs.service.js';

const DOCUMENT_ID = 'b5097f47-3eea-4df3-891d-2bb9b3f60f11';

// The actual, registered document in our system
const docA = await getOrCreateDocument(DOCUMENT_ID);

// A completely separate, independent Y.Doc — standing in for another client's local replica
const docB = new Y.Doc();
docB.getText('content').insert(0, 'Hello from a separate replica');

// Turn docB's change into portable bytes
const update = Y.encodeStateAsUpdate(docB);

// Merge it into the REGISTERED document via our new service function
applyUpdate(DOCUMENT_ID, update);

// Confirm the change actually landed in docA
const resultText = docA.getText('content').toString();
console.log('docA content after applyUpdate:', resultText);
console.log('Matches expected?', resultText === 'Hello from a separate replica');

// Confirm rejection for a document that was never loaded
try {
  applyUpdate('00000000-0000-0000-0000-000000000000', update);
  console.log('UNEXPECTED: did not throw for an unloaded document');
} catch (err) {
  console.log('Correctly rejected:', err.message);
}

process.exit(0);