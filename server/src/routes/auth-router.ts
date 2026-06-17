import { Router } from 'express';
import * as authController from '../controllers/auth-controller.js';
import { requireAuth } from '../middlewares/auth-middleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.get('/config', authController.getConfig);
router.get('/me', requireAuth, authController.getMe);

export default router;
