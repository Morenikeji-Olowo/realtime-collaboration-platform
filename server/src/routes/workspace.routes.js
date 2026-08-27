import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import * as workspaceController from '../controllers/workspace.controller.js';
import * as invitationController from '../controllers/invitation.controller.js';

const workspaceRouter = Router();

workspaceRouter.post('/', authMiddleware, workspaceController.createWorkspace);
workspaceRouter.get('/', authMiddleware, workspaceController.listWorkspaces);
workspaceRouter.get('/:id', authMiddleware, workspaceController.getWorkspace);
workspaceRouter.patch('/:id', authMiddleware, workspaceController.renameWorkspace);
workspaceRouter.delete('/:id', authMiddleware, workspaceController.deleteWorkspace);
workspaceRouter.post('/:id/invitations', authMiddleware, invitationController.createInvitation);

export default workspaceRouter;