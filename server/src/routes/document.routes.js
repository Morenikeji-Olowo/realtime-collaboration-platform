import { Router } from "express";
import * as documentController from "../controllers/document.controller.js";    
import authMiddleware from "../middleware/auth.js";

const documentRouter = Router();

documentRouter.get('/:id', authMiddleware, documentController.getDocument);
documentRouter.patch('/:id', authMiddleware, documentController.renameDocument);
documentRouter.delete('/:id', authMiddleware, documentController.deleteDocument);

export default documentRouter;