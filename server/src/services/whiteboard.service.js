import redis from "../config/redis";
import { AppError } from "../middleware/error";

export async function applyOperation(workspaceId, objectId, action, data) {
    if(action !== 'upsert' && action !== 'delete'){
        throw new AppError('Invalid Operation action', 400);
    }

    if(!objectId){
        throw new AppError('objectId is required', 400);
    }

    if(action === 'upsert' && !data){
        throw new AppError('data is required for upsert operation', 400);
    }

    const objectsKey = `whiteboard:${workspaceId}:objects`;
    const revisionKey = `whiteboard:${workspaceId}:revision`;

    const multi = redis.multi();

    if(action === 'upsert'){
        multi.hset(objectsKey, objectId, JSON.stringify(data));
    }else{
        multi.hdel(objectsKey, objectId);
    }

    multi.incr(revisionKey);
    multi.sadd('whiteboard:dirty', workspaceId);

    await multi.exec();
}

export async function getDirtyWorkspaces(){
    return redis.smembers('whiteboard:dirty');
}

export async function readSnapshot(workspaceId){
    const objectsKey = `whiteboard:${workspaceId}:objects`;
    const revisionKey = `whiteboard:${workspaceId}:revision`;

    const multi = redis.multi();
    multi.hgetall(objectsKey);
    multi.get(revisionKey);

    const [[, objectsHash], [, revision]] = await multi.exec();

    const objects = Object.values(objectsHash).map((json) => JSON.parse(json));

    return { objects, revision: Number(revision) || 0 };
}

export async function markPersisted(workspaceId, persistedRevision){
    const currentRevision  = await redis.get(`whiteboard:${workspaceId}:revision`);

    if(Number(currentRevision) !== persistedRevision){
        await redis.srem('whiteboard:dirty', workspaceId);
    }
}