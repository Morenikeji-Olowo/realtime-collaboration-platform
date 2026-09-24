import * as fileService from '../services/file.service.js';

export async function getUploadUrl(req, res, next) {
  try {
    const { filename, mimeType, sizeBytes } = req.body;

    const result = await fileService.getUploadUrl(req.params.workspaceId, req.user.id, {
      filename,
      mimeType,
      sizeBytes,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
export async function completeUpload(req, res, next) {
  try {
    const { workspaceId, originalName } = req.body;

    const result = await fileService.completeUpload(req.params.fileId, req.user.id, {
      workspaceId,
      originalName,
    });

    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getDownloadUrl(req, res, next) {
  try {
    const result = await fileService.getDownloadUrl(req.params.fileId, req.user.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function deleteFile(req, res, next) {
  try {
    await fileService.deleteFile(req.params.fileId, req.user.id);
    return res.status(200).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}