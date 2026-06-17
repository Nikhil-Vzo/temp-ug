import { Router } from 'express';
import * as userController from '../controllers/user-controller.js';
// Assuming you have an auth middleware. If not, comment this out for testing:
// import { requireAuth } from '../../core/middleware/auth';

const router = Router();

// Apply authentication guard to all user routes
// (Comment this line out temporarily if you are testing without JWTs)
// router.use(requireAuth);

// ==========================================
// 1. Static & Specialty Routes (Must be first)
// ==========================================

// GET /api/users/session (Fetches the logged-in user's mega-payload)
router.get('/session', userController.getSession);

// ==========================================
// 2. Creation Routes (POST)
// ==========================================

// POST /api/users (Create standalone user)
router.post('/', userController.createUserStandalone);

// POST /api/users/organization (Create user directly inside an org)
router.post('/organization', userController.createUser);

// POST /api/users/invite (Create user via invitation token)
router.post('/invite', userController.createUserFromInvite);

// ==========================================
// 3. Lookup Routes by Specific Fields
// ==========================================

// GET /api/users/uuid/123e4567-e89b-12d3-a456-426614174000
router.get('/uuid/:uuid', userController.getUserByUuid);

// GET /api/users/email/test@campusos.com
router.get('/email/:email', userController.getUserByEmail);

// ==========================================
// 4. Root ID Routes (Must be last)
// ==========================================

// GET /api/users/65c2a1e8f3b2c1d0a5e6b7c9
router.get('/:id', userController.getUserById);

// DELETE /api/users/65c2a1e8f3b2c1d0a5e6b7c9
router.delete('/:id', userController.deleteUser);

export default router;