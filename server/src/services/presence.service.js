import redis from "../config/redis.js";

export async function addConnection(workspaceId, userId){
    const count = await redis.incr(`presence:${workspaceId}:${userId}`);

    if(count === 1){
        await redis.sadd(`presence:${workspaceId}`, userId);
        return true;
    }

    return false;
}

export async function removeConnection(workspaceId, userId){
    const count = await redis.decr(`presence:${workspaceId}:${userId}`);

    if(count <= 0){
        if(count < 0){
            console.error(`Presence counter went negative for workspace:${workspaceId} user:${userId} (count: ${count}) - likely an unmatched disconnect. Resetting.`);   
        }

        await redis.del(`presence:${workspaceId}:${userId}`);
        await redis.srem(`presence:${workspaceId}`, userId);
        return true;
    }

    return false;
}

export async function getOnlineUsers(workspaceId){
    return redis.smembers(`presence:${workspaceId}`);
}