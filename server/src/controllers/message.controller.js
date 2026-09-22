import * as messageService from '../services/message.service.js';

export async function listMessages(req, res, next) {
  try {
    const messages = await messageService.listMessages(req.params.id, req.user.id);
    return res.status(200).json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
}