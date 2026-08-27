import * as authController from '../controllers/auth.controller.js';
import {Router} from 'express';

const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.post('/signup', authController.signUp);

export default authRouter;