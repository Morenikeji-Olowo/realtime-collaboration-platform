import * as usersController from '../controllers/users.controller.js';
import express from 'express';
import authMiddleware from '../middleware/auth.js';

const usersRouter = express.Router();

usersRouter.get('/me', authMiddleware, usersController.getMe);

export default usersRouter;