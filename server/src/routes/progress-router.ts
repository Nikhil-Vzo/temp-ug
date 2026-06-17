import { Router } from 'express';
import * as progressController from '../controllers/progress-controller.js';

const router = Router();

// POST /api/v1/lessons/:lessonId/start
router.post('/lessons/:lessonId/start', progressController.startLesson);

// PATCH /api/v1/lessons/:lessonId/progress
router.patch('/lessons/:lessonId/progress', progressController.updateProgress);

// POST /api/v1/lessons/:lessonId/complete
router.post('/lessons/:lessonId/complete', progressController.completeLesson);

// GET /api/v1/courses/:courseId/progress
router.get('/courses/:courseId/progress', progressController.getCourseProgress);

export default router;
