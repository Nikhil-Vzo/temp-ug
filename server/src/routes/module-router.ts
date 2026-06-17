import { Router } from 'express';
import * as moduleController from '../controllers/module-controller.js';

const router = Router();

// ==========================================
// Section-nested Module Routes
// ==========================================

// POST /api/v1/sections/:sectionId/modules
router.post('/sections/:sectionId/modules', moduleController.createModule);

// GET /api/v1/sections/:sectionId/modules
router.get('/sections/:sectionId/modules', moduleController.getModules);

// ==========================================
// Individual Module Routes
// ==========================================

// PATCH /api/v1/modules/:moduleId
router.patch('/modules/:moduleId', moduleController.updateModule);

// DELETE /api/v1/modules/:moduleId
router.delete('/modules/:moduleId', moduleController.deleteModule);

export default router;
