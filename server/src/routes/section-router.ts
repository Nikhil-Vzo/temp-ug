import { Router } from 'express';
import * as sectionController from '../controllers/section-controller.js';

const router = Router();

// ==========================================
// Course-nested Section Routes
// ==========================================

// POST /api/v1/courses/:courseId/sections
router.post('/courses/:courseId/sections', sectionController.createSection);

// GET /api/v1/courses/:courseId/sections
router.get('/courses/:courseId/sections', sectionController.getSections);

// ==========================================
// Individual Section Routes
// ==========================================

// PATCH /api/v1/sections/:sectionId
router.patch('/sections/:sectionId', sectionController.updateSection);

// DELETE /api/v1/sections/:sectionId
router.delete('/sections/:sectionId', sectionController.deleteSection);

export default router;
