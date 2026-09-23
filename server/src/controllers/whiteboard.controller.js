import * as whiteboardService from '../services/whiteboard.service.js';

export async function getWorkspaceWhiteboard(req, res, next) {
  try {
    const whiteboard = await whiteboardService.getWorkspaceWhiteboard(req.params.id, req.user.id);
    return res.status(200).json({ success: true, data: whiteboard });
  } catch (err) {
    next(err);
  }
}