import { Router } from 'express';
import * as lessonController from '../controllers/lesson-controller.js';

const router = Router();

// ==========================================
// Module-nested Lesson Routes
// ==========================================

// POST /api/v1/modules/:moduleId/lessons
router.post('/modules/:moduleId/lessons', lessonController.createLesson);

// ==========================================
// Individual Lesson Routes
// ==========================================

// GET /api/v1/lessons/:lessonId
router.get('/lessons/:lessonId', lessonController.getLesson);

// PATCH /api/v1/lessons/:lessonId
router.patch('/lessons/:lessonId', lessonController.updateLesson);

// DELETE /api/v1/lessons/:lessonId
router.delete('/lessons/:lessonId', lessonController.deleteLesson);

export default router;
