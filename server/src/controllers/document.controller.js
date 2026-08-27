import * as documentService from "../services/document.service.js";

export async function createDocument(req, res, next) {
  try {
    const { title } = req.body;
    const document = await documentService.createDocument(
      req.params.workspaceId,
      req.user.id,
      title,
    );
    return res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
}

export async function listDocuments(req, res, next) {
  try {
    const documents = await documentService.listDocuments(
      req.params.workspaceId,
      req.user.id,
    );
    return res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDocument(req, res, next) {
  try {
    const document = await documentService.getDocumentById(
      req.params.id,
      req.user.id,
    );
    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
}

export async function renameDocument(req, res, next) {
  try {
    const { title } = req.body;
    const document = await documentService.renameDocument(
      req.params.id,
      req.user.id,
      title,
    );
    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    await documentService.deleteDocument(req.params.id, req.user.id);
    return res.status(200).json({
      success: true,
      data: null,
    });
  } catch (error) {
    next(error);
  }
}
