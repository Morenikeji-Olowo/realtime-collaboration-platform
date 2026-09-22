import supabase from '../config/supabase.js';
import { AppError } from '../middleware/error.js';
import { getMembership } from './workspace.service.js';

export async function listMessages(workspaceId, userId) {
  const membership = await getMembership(workspaceId, userId);
  if (!membership) {
    throw new AppError('Workspace not found', 404);
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new AppError('Failed to load messages', 500);
  }

  return data;
}