import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import * as fileController from '../controllers/file.controller.js';

const fileRouter = Router();

fileRouter.post('/:fileId/complete', authMiddleware, fileController.completeUpload);
fileRouter.get('/:fileId/download-url', authMiddleware, fileController.getDownloadUrl);

export default fileRouter;