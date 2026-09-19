import * as Y from 'yjs';
import supabase from '../config/supabase.js';
import { AppError } from '../middleware/error.js';

const documents = new Map();

function hexByteaToUint8Array(hexBytea) {
  if (!hexBytea || hexBytea === '\\x') {
    return new Uint8Array(0);
  }

  const hex = hexBytea.startsWith('\\x') ? hexBytea.slice(2) : hexBytea;
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

async function loadDocument(documentId) {
  const { data, error } = await supabase
    .from('documents')
    .select('content')
    .eq('id', documentId)
    .single();

  if (error) {
    throw new AppError('Failed to load document', 500, { cause: error });
  }

  const doc = new Y.Doc();
  const snapshot = hexByteaToUint8Array(data.content);

  if (snapshot.length > 0) {
    Y.applyUpdate(doc, snapshot);
  }

  return doc;
}

export async function getOrCreateDocument(documentId) {
  if (documents.has(documentId)) {
    return documents.get(documentId);
  }

  const doc = await loadDocument(documentId);
  documents.set(documentId, doc);

  return doc;
}

export function getDocument(documentId) {
  return documents.get(documentId);
}