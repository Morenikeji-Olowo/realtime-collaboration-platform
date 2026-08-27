import * as workspaceService from "../services/workspace.service.js";

export async function createWorkspace(req, res, next) {
  try {
    const { name } = req.body;
    const workspace = await workspaceService.createWorkspace(name, req.user.id);

    return res.status(201).json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
}

export async function listWorkspaces(req, res, next) {
  try {
    const workspaces = await workspaceService.listWorkspaces(req.user.id);
    return res.status(200).json({
      success: true,
      data: workspaces,
    });
  } catch (error) {
    next(error);
  }
}

export async function getWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.getWorkspaceById(
      req.params.id,
      req.user.id,
    );
    return res.status(200).json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
}

export async function renameWorkspace(req, res, next) {
  try {
    const { name } = req.body;
    const workspace = await workspaceService.renameWorkspace(
      req.params.id,
      req.user.id,
      name,
    );
    return res.status(200).json({
      success: true,
      data: workspace,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteWorkspace(req, res, next) {
  try {
    await workspaceService.deleteWorkspace(req.params.id, req.user.id);
    return res.status(200).json({
      success: true,
      data: null,
    });
  } catch (error) {
    next(error);
  }
}
