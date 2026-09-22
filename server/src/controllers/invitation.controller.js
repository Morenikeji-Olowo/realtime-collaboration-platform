import * as invitationService from "../services/invitation.service.js";
import { AppError } from "../middleware/error.js";

export async function createInvitation(req, res, next) {
  try {
    const { email } = req.body;
    const invitation = await invitationService.createInvitation(
      req.params.id,
      req.user.id,
      req.user.email,
      email
    );
    return res.status(201).json({ success: true, data: invitation });
  } catch (err) {
    next(err);
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

export async function listInvitations(req, res, next) {
  try {
    const invitations = await invitationService.listInvitations(req.params.id, req.user.id);
    return res.status(200).json({ success: true, data: invitations });
  } catch (err) {
    next(err);
  }
}