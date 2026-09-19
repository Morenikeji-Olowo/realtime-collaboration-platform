import 'dotenv/config';
import { getOrCreateDocument, getDocument } from '../src/services/yjs.service.js';

const DOCUMENT_ID = 'b5097f47-3eea-4df3-891d-2bb9b3f60f11';

const doc1 = await getOrCreateDocument(DOCUMENT_ID);
console.log('First call returned:', doc1.constructor.name);

const doc2 = await getOrCreateDocument(DOCUMENT_ID);
console.log('Second call returned:', doc2.constructor.name);
console.log('Same instance (cache hit)?', doc1 === doc2);

const lookedUp = getDocument(DOCUMENT_ID);
console.log('getDocument() returns same instance?', lookedUp === doc1);

const missing = getDocument('00000000-0000-0000-0000-000000000000');
console.log('getDocument() on unknown id returns undefined?', missing === undefined);

process.exit(0);