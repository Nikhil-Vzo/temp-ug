import { Router } from 'express';
import * as mediaController from '../controllers/media-controller.js';

const router = Router();

// POST /api/v1/media/upload-url
router.post('/media/upload-url', mediaController.generateUploadUrl);

// POST /api/v1/lessons/:lessonId/content
router.post('/lessons/:lessonId/content', mediaController.attachVideo);

// GET /api/v1/lessons/:lessonId/stream
router.get('/lessons/:lessonId/stream', mediaController.getStreamingUrl);

export default router;
