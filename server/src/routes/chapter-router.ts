import { Router } from 'express';
import * as chapterController from '../controllers/chapter-controller.js';
// Assuming you have an auth middleware. If not, comment this out for testing:
// import { requireAuth } from '../../core/middleware/auth';

const router = Router();

// Apply authentication guard to all chapter routes
// (Comment this line out temporarily if you are testing without JWTs)
// router.use(requireAuth);

// ==========================================
// 1. Course-Level Chapter Routes (Must be FIRST)
// ==========================================

// PATCH /api/chapters/course/:courseUuid/reorder
// (The heavy-lifter for drag-and-drop UI)
router.patch('/course/:courseUuid/reorder', chapterController.reorderChaptersAndActivities);

// GET /api/chapters/course/:courseUuid
// (Fetches the ordered curriculum tree)
router.get('/course/:courseUuid', chapterController.getCourseChapters);

// POST /api/chapters/course/:courseUuid
// (Creates a chapter and injects it into the Course array)
router.post('/course/:courseUuid', chapterController.createChapter);

// GET /api/chapters/legacy/course/:courseId
// (DEPRECATED: Fetches unordered chapters by MongoDB ObjectId)
router.get('/legacy/course/:courseId', chapterController.getCourseChaptersLegacy);

// ==========================================
// 2. Individual Chapter Routes (Must be LAST)
// ==========================================

// GET /api/chapters/:chapterUuid
router.get('/:chapterUuid', chapterController.getChapter);

// PATCH /api/chapters/:chapterUuid
router.patch('/:chapterUuid', chapterController.updateChapter);

// DELETE /api/chapters/:chapterUuid
router.delete('/:chapterUuid', chapterController.deleteChapter);

export default router;