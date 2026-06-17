import { type Request, type Response } from 'express';
import { catchAsync } from '../config/CatchAsync.js';
import * as analyticsService from '../services/analytics-service.js';

// ==========================================
// 1. Get Student Learning Analytics
// ==========================================
export const getStudentAnalytics = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id || req.query.userId || "6a2fde02acf82e9382a4ad9b";

  const analytics = await analyticsService.get_student_analytics(userId as string);

  res.status(200).json({
    status: 'success',
    data: analytics
  });
});

// ==========================================
// 2. Get Course Stats (Instructor view)
// ==========================================
export const getCourseAnalytics = catchAsync(async (req: any, res: Response) => {
  const { courseId } = req.params;

  const analytics = await analyticsService.get_course_analytics(courseId);

  res.status(200).json({
    status: 'success',
    data: analytics
  });
});

// ==========================================
// 3. Get Instructor dashboard overview
// ==========================================
export const getInstructorDashboard = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id || req.query.userId || "6a2fde02acf82e9382a4ad9b";

  const dashboard = await analyticsService.get_instructor_dashboard(userId as string);

  res.status(200).json({
    status: 'success',
    data: dashboard
  });
});

// ==========================================
// 4. Get Admin dashboard overview
// ==========================================
export const getAdminDashboard = catchAsync(async (req: any, res: Response) => {
  const dashboard = await analyticsService.get_admin_dashboard();

  res.status(200).json({
    status: 'success',
    data: dashboard
  });
});
