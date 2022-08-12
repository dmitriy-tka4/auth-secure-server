import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import isAuth from '../middlewares/is-auth.middleware.js';

const router = Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.delete('/logout', isAuth, authController.logout);
router.post('/refresh', authController.refresh);

export default router;
