import { Router } from 'express';
import * as certificateController from '../controllers/certificate-controller.js';

const router = Router();

// POST /api/v1/certificates/generate
router.post('/certificates/generate', certificateController.generateCertificate);

// GET /api/v1/users/me/certificates
router.get('/users/me/certificates', certificateController.getMyCertificates);

// GET /api/v1/certificates/verify/:certificateCode
router.get('/certificates/verify/:certificateCode', certificateController.verifyCertificate);

export default router;
