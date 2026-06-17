import { Router } from 'express';
import * as analyticsController from '../controllers/analytics-controller.js';

const router = Router();

// GET /api/v1/analytics/student
router.get('/analytics/student', analyticsController.getStudentAnalytics);

// GET /api/v1/courses/:courseId/analytics
router.get('/courses/:courseId/analytics', analyticsController.getCourseAnalytics);

// GET /api/v1/instructor/dashboard
router.get('/instructor/dashboard', analyticsController.getInstructorDashboard);

// GET /api/v1/admin/dashboard
router.get('/admin/dashboard', analyticsController.getAdminDashboard);

export default router;
