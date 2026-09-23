import supabase from '../config/supabase.js';
import { AppError } from '../middleware/error.js';
import { getMembership } from './workspace.service.js';

export async function listActivity(workspaceId, userId, { limit = 20, before } = {}) {
  const membership = await getMembership(workspaceId, userId);

  if (!membership) {
    throw new AppError('Workspace not found', 404);
  }

  let query = supabase
    .from('activity')
    .select('id, event_type, actor_id, target_id, metadata, created_at, users(id, name, email)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (before) {
    const [beforeCreatedAt, beforeId] = before.split('|');

    if (!beforeCreatedAt || !beforeId) {
      throw new AppError('Invalid pagination cursor', 400);
    }

    query = query.or(
      `created_at.lt.${beforeCreatedAt},and(created_at.eq.${beforeCreatedAt},id.lt.${beforeId})`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError('Failed to load activity', 500);
  }

  const items = data.map((row) => ({
    id: row.id,
    event_type: row.event_type,
    actor: row.users,
    target_id: row.target_id,
    metadata: row.metadata,
    created_at: row.created_at,
  }));

  const last = items[items.length - 1];
  const nextCursor = items.length === limit && last ? `${last.created_at}|${last.id}` : null;

  return { items, nextCursor };
}

export async function logDocumentCreated(workspaceId, actorId, documentId, title) {
  const { error } = await supabase.from('activity').insert({
    workspace_id: workspaceId,
    actor_id: actorId,
    event_type: 'document_created',
    target_id: documentId,
    metadata: { title },
  });

  if (error) {
    throw new AppError('Failed to log activity', 500, { cause: error });
  }
}