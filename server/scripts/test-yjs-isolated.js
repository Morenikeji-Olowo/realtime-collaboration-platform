import * as Y from 'yjs';

const documents = new Map();

function hexByteaToUint8Array(hexBytea) {
  if (!hexBytea || hexBytea === '\\x') {
    return new Uint8Array(0);
  }
  const hex = hexBytea.startsWith('\\x') ? hexBytea.slice(2) : hexBytea;
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

async function loadDocument(documentId) {
  const fakeData = { content: '\\x' }; // no real Supabase call at all

  const doc = new Y.Doc();
  const snapshot = hexByteaToUint8Array(fakeData.content);

  if (snapshot.length > 0) {
    Y.applyUpdate(doc, snapshot);
  }

  return doc;
}

async function getOrCreateDocument(documentId) {
  if (documents.has(documentId)) {
    return documents.get(documentId);
  }
  const doc = await loadDocument(documentId);
  documents.set(documentId, doc);
  return doc;
}

function getDocument(documentId) {
  return documents.get(documentId);
}

const doc1 = await getOrCreateDocument('test-id');
console.log('First call:', doc1.constructor.name);

const doc2 = await getOrCreateDocument('test-id');
console.log('Second call:', doc2.constructor.name);
console.log('Same instance?', doc1 === doc2);
console.log('Map size:', documents.size);