import { Router } from 'express';
import * as profileController from '../controllers/profile.controller.js';
import isAuth from '../middlewares/is-auth.middleware.js';

const router = Router();

router.get('/', isAuth, profileController.getUserInfo);

export default router;
