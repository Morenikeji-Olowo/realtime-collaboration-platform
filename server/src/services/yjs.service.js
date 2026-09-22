import * as Y from 'yjs';
import supabase from '../config/supabase.js';
import { AppError } from '../middleware/error.js';
import { withLock } from '../utils/redisLock.js';

const documents = new Map();
const FLUSH_LOCK_TTL_MS = 10000; // starting value -- needs empirical tuning, no prior art to base it on


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
    return documents.get(documentId).doc;
  }

  const doc = await loadDocument(documentId);

  documents.set(documentId, {
    doc,
    revision: 0,
    lastPersistedRevision: 0,
      localParticipants: 0,   // NEW
  });

  return doc;
}

export function getDocument(documentId) {
  return documents.get(documentId)?.doc;
}

export function getDocumentState(documentId) {
  const entry = documents.get(documentId);
  if (!entry) return undefined;

  return {
    doc: entry.doc,
    revision: entry.revision,
    lastPersistedRevision: entry.lastPersistedRevision,
    dirty: entry.revision !== entry.lastPersistedRevision,
    localParticipants: entry.localParticipants,
  };
}

export function applyUpdate(documentId, update) {
  const entry = documents.get(documentId);

  if (!entry) {
    throw new AppError('Document is not currently loaded', 404);
  }

  if (!(update instanceof Uint8Array)) {
    throw new AppError('Update must be binary data (Uint8Array)', 400);
  }

  Y.applyUpdate(entry.doc, update);
  entry.revision++;
}

export function markPersistedIfCurrent(documentId, persistedRevision) {
  const entry = documents.get(documentId);

  if (!entry) {
    return false;
  }

  if (entry.revision === persistedRevision) {
    entry.lastPersistedRevision = persistedRevision;
    return true;
  }

  return false;
}

export async function flushDocument(documentId) {
  const entry = documents.get(documentId);

  if (!entry) {
    throw new AppError('Document is not currently loaded', 404);
  }

  const lockKey = `document:${documentId}:flush-lock`;

  const { acquired, result } = await withLock(lockKey, FLUSH_LOCK_TTL_MS, async (checkOwnership) => {
    const { data, error } = await supabase
      .from('documents')
      .select('content')
      .eq('id', documentId)
      .single();

    if (error) {
      throw new AppError('Failed to read document for flush', 500, { cause: error });
    }

    try {
      const persistedSnapshot = hexByteaToUint8Array(data.content);
      if (persistedSnapshot.length > 0) {
        Y.applyUpdate(entry.doc, persistedSnapshot); // reconciliation, NOT a new edit
      }
    } catch (mergeError) {
      throw new AppError('Persisted document snapshot is corrupt or invalid', 500, { cause: mergeError });
    }

    const persistingRevision = entry.revision; // captured AFTER merge, BEFORE encode/write
    const mergedSnapshot = Y.encodeStateAsUpdate(entry.doc);
    const hexPayload = '\\x' + Buffer.from(mergedSnapshot).toString('hex');

    checkOwnership(); // critical gate -- immediately before the write, per spec

    const { error: writeError } = await supabase
      .from('documents')
      .update({ content: hexPayload })
      .eq('id', documentId);

    if (writeError) {
      throw new AppError('Failed to persist document snapshot', 500, { cause: writeError });
    }

    const cleared = markPersistedIfCurrent(documentId, persistingRevision);
    return { dirty: !cleared };
  });

  if (!acquired) {
    return { flushed: false, reason: 'lock_unavailable' };
  }

  return { flushed: true, dirty: result.dirty };
}


export function addParticipant(documentId) {
  const entry = documents.get(documentId);

  if (!entry) {
    throw new AppError('Document is not currently loaded', 404);
  }

  entry.localParticipants++;
}

export function removeParticipant(documentId) {
  const entry = documents.get(documentId);

  if (!entry) {
    throw new AppError('Document is not currently loaded', 404);
  }

  if (entry.localParticipants <= 0) {
    throw new AppError('Document has no local participants', 409);
  }

  entry.localParticipants--;
}

export function disposeDocument(documentId) {
  const entry = documents.get(documentId);

  if (!entry) {
    return { disposed: false, reason: 'not_loaded' };
  }

  if (entry.localParticipants > 0) {
    return { disposed: false, reason: 'has_participants' };
  }

  if (entry.revision !== entry.lastPersistedRevision) {
    return { disposed: false, reason: 'dirty' };
  }

  documents.delete(documentId);
  return { disposed: true };
}