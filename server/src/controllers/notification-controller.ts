import { type Request, type Response } from 'express';
import { catchAsync } from '../config/CatchAsync.js';
import * as notificationService from '../services/notification-service.js';

// ==========================================
// 1. Get Notifications
// ==========================================
export const getNotifications = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id || "6a2fde02acf82e9382a4ad9b";

  const notifications = await notificationService.get_notifications(userId);

  res.status(200).json({
    status: 'success',
    results: notifications.length,
    data: { notifications }
  });
});

// ==========================================
// 2. Mark Notification as Read
// ==========================================
export const markRead = catchAsync(async (req: any, res: Response) => {
  const { notificationId } = req.params;
  const userId = req.user?.id || "6a2fde02acf82e9382a4ad9b";

  const notification = await notificationService.mark_read(notificationId, userId);

  res.status(200).json({
    status: 'success',
    data: { notification }
  });
});
