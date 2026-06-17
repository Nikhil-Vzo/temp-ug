import { Router } from 'express';
import * as notificationController from '../controllers/notification-controller.js';

const router = Router();

// GET /api/v1/notifications
router.get('/notifications', notificationController.getNotifications);

// PATCH /api/v1/notifications/:notificationId/read
router.patch('/notifications/:notificationId/read', notificationController.markRead);

export default router;
