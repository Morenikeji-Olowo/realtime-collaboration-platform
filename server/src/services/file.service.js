import { randomUUID } from 'node:crypto';
import bucket from '../config/gcs.js';
import { AppError } from '../middleware/error.js';
import { getMembership } from './workspace.service.js';
import supabase from '../config/supabase.js';   

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const UPLOAD_URL_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

export async function getUploadUrl(workspaceId, userId, { filename, mimeType, sizeBytes }) {
  const membership = await getMembership(workspaceId, userId);

  if (!membership) {
    throw new AppError('Workspace not found', 404);
  }

  if (!filename || typeof filename !== 'string') {
    throw new AppError('filename is required', 400);
  }

  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    throw new AppError('sizeBytes must be a positive integer', 400);
  }

  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new AppError('File exceeds the 100 MB size limit', 400);
  }

  const resolvedMimeType = mimeType || 'application/octet-stream';
  const fileId = randomUUID();
  const storagePath = `workspaces/${workspaceId}/${fileId}`;

  let uploadUrl;
  try {
    [uploadUrl] = await bucket.file(storagePath).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + UPLOAD_URL_EXPIRY_MS,
      contentType: resolvedMimeType,
    });
  } catch (err) {
    throw new AppError('Failed to generate upload URL', 500, { cause: err });
  }

  return {
    fileId,
    uploadUrl,
    mimeType: resolvedMimeType,
    expiresAt: new Date(Date.now() + UPLOAD_URL_EXPIRY_MS).toISOString(),
  };
}


export async function completeUpload(fileId, userId, { workspaceId, originalName }) {
  if (!workspaceId || typeof workspaceId !== 'string') {
    throw new AppError('workspaceId is required', 400);
  }

  const membership = await getMembership(workspaceId, userId);

  if (!membership) {
    throw new AppError('Workspace not found', 404);
  }

  if (!originalName || typeof originalName !== 'string') {
    throw new AppError('originalName is required', 400);
  }

  const storagePath = `workspaces/${workspaceId}/${fileId}`;
  const gcsFile = bucket.file(storagePath);

  const [exists] = await gcsFile.exists();

  if (!exists) {
    throw new AppError('Upload was not completed — file not found in storage', 400);
  }

  const [metadata] = await gcsFile.getMetadata();

  const { data, error } = await supabase
    .from('workspace_files')
    .insert({
      id: fileId,
      workspace_id: workspaceId,
      uploaded_by: userId,
      original_name: originalName,
      storage_path: storagePath,
      mime_type: metadata.contentType || 'application/octet-stream',
      size_bytes: Number(metadata.size),
    })
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to record uploaded file', 500, { cause: error });
  }

  return data;
}