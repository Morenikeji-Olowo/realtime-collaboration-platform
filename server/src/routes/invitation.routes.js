import { Router } from "express";
import * as invitationController from "../controllers/invitation.controller.js";
import authMiddleware from "../middleware/auth.js";

const invitationRouter = Router();

invitationRouter.post('/:id/accept', authMiddleware, invitationController.acceptInvitation);
invitationRouter.post('/:id/reject', authMiddleware, invitationController.rejectInvitation);

export default invitationRouter;