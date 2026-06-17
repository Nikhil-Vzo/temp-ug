import { Router } from "express";
import * as orgController from '../controllers/organization-controller.js';

const router = Router();

// Apply authentication guard to all organization routes
// (Comment this line out temporarily if you are testing without JWTs)
// router.use(requireAuth);

// ==========================================
// 1. Static & Specialty Routes 
// (MUST be defined before /:uuid routes)
// ==========================================
// GET /api/organizations/my-orgs?adminOnly=true
router.get('/my-orgs', orgController.getUserOrganizations);

// GET /api/organizations/slug/harvard
router.get('/slug/:slug', orgController.getOrganizationBySlug);

// ==========================================
// 2. Root Routes
// ==========================================
// POST /api/organizations
router.post(
  '/', 
  // validateRequest(OrgCreateSchema), // Uncomment when DTOs are ready
  orgController.createOrganization
);

// ==========================================
// 3. UUID Parameter Routes
// ==========================================
// GET /api/organizations/550e8400-e29b-41d4-a716-446655440000
router.get('/:uuid', orgController.getOrganizationByUuid);

// PATCH /api/organizations/550e8400-e29b-41d4-a716-446655440000
router.patch(
  '/:uuid', 
  // validateRequest(OrgUpdateSchema), // Uncomment when DTOs are ready
  orgController.updateOrganization
);

// DELETE /api/organizations/550e8400-e29b-41d4-a716-446655440000
router.delete('/:uuid', orgController.deleteOrganization);

// Organization Members Management Routes
router.get('/:uuid/users', orgController.getOrganizationMembers);
router.patch('/:uuid/users/:userId', orgController.updateMemberRole);
router.delete('/:uuid/users/:userId', orgController.removeMember);

export default router;