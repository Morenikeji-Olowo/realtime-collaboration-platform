import * as activityService from '../services/activity.service.js';

export async function listActivity(req, res, next) {
  try {
    const parsedLimit = Number(req.query.limit);
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined;

    const { items, nextCursor } = await activityService.listActivity(req.params.id, req.user.id, {
      limit,
      before: req.query.before,
    });

    return res.status(200).json({
      success: true,
      data: items,
      next_cursor: nextCursor,
    });
  } catch (err) {
    next(err);
  }
}