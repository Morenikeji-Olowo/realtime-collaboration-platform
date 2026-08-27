import * as invitationService from "../services/invitation.service.js";
import { AppError } from "../middleware/error.js";

export async function createInvitation(req, res, next) {
  try {
    const { email } = req.body;

    const invitation = await invitationService.createInvitation(
      req.params.id,
      req.user.id,
      email,
    );
    return res.status(201).json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    next(error);
  }
}
export async function acceptInvitation(req, res, next) {
  try {
    const workspace = await invitationService.acceptInvitation(
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

export async function rejectInvitation(req, res, next) {
  try {
    const invitation = await invitationService.rejectInvitation(
      req.params.id,
      req.user.email,
    );
    return res.status(200).json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    next(error);
  }
}
