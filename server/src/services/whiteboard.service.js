import { AppError } from '../middleware/error.js';
import redis from '../config/redis.js';
import supabase from '../config/supabase.js';

redis.defineCommand('markPersistedIfCurrent', {
  numberOfKeys: 2,
  lua: `
    local currentRevision = redis.call('GET', KEYS[1])
    if currentRevision == ARGV[1] then
      redis.call('SREM', KEYS[2], ARGV[2])
      return 1
    else
      return 0
    end
  `,
});

function assertNoMultiErrors(results) {
  for (const [err] of results) {
    if (err) {
      throw new AppError('Whiteboard operation failed', 500, { cause: err });
    }
  }
}

export async function applyOperation(workspaceId, objectId, action, data) {
  if (action !== 'upsert' && action !== 'delete') {
    throw new AppError('Invalid operation action', 400);
  }

  if (!objectId) {
    throw new AppError('objectId is required', 400);
  }

  if (action === 'upsert' && !data) {
    throw new AppError('data is required for upsert operations', 400);
  }

  const objectsKey = `whiteboard:${workspaceId}:objects`;
  const revisionKey = `whiteboard:${workspaceId}:revision`;

  const multi = redis.multi();

  if (action === 'upsert') {
    multi.hset(objectsKey, objectId, JSON.stringify(data));
  } else {
    multi.hdel(objectsKey, objectId);
  }

  multi.incr(revisionKey);
  multi.sadd('whiteboard:dirty', workspaceId);

  const results = await multi.exec();
  assertNoMultiErrors(results);
}

export async function getDirtyWorkspaces() {
  return redis.smembers('whiteboard:dirty');
}

export async function readSnapshot(workspaceId) {
  const objectsKey = `whiteboard:${workspaceId}:objects`;
  const revisionKey = `whiteboard:${workspaceId}:revision`;

  const multi = redis.multi();
  multi.hgetall(objectsKey);
  multi.get(revisionKey);

  const results = await multi.exec();
  assertNoMultiErrors(results);

  const [[, objectsHash], [, revision]] = results;
  const objects = Object.values(objectsHash).map((json) => JSON.parse(json));

  return { objects, revision: Number(revision) || 0 };
}

export async function markPersisted(workspaceId, persistedRevision) {
  const result = await redis.markPersistedIfCurrent(
    `whiteboard:${workspaceId}:revision`,
    'whiteboard:dirty',
    String(persistedRevision),
    workspaceId
  );

  return result === 1;
}

export async function flushWorkspace(workspaceId) {
  const { objects, revision } = await readSnapshot(workspaceId);

  const { error } = await supabase
    .from('whiteboards')
    .update({ state: { version: 1, objects } })
    .eq('workspace_id', workspaceId);

  if (error) {
    throw new AppError('Failed to persist whiteboard snapshot', 500, { cause: error });
  }

  await markPersisted(workspaceId, revision);
}

export async function flushAllDirty(){
    const dirtyWorkspaces = await getDirtyWorkspaces();

    for(const workspaceId of dirtyWorkspaces){
        try{
            await flushWorkspace(workspaceId);
        }
        catch(error){
            console.error(`Failed to flush whiteboard for workspace ${workspaceId}:`, error);   
        }
    }
}