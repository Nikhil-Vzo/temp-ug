import { Router } from 'express';
import * as courseController from '../controllers/course-controller.js';
// Assuming you have an auth middleware. If not, comment this out for testing:
// import { requireAuth } from '../../core/middleware/auth';

const router = Router();

// Apply authentication guard to all course routes
// (Comment this line out temporarily if you are testing without JWTs)
// router.use(requireAuth);

// ==========================================
// 1. Static & Specialty Routes (Must be FIRST)
// ==========================================

// GET /api/courses/search?orgId=123&q=typescript
router.get('/search', courseController.searchCourses);

// GET /api/courses/org/:slug/count
router.get('/org/:slug/count', courseController.getCoursesCountByOrgSlug);

// GET /api/courses/org/:slug
router.get('/org/:slug', courseController.getCoursesByOrgSlug);

// ==========================================
// 2. Creation Routes
// ==========================================

// GET /api/courses (Get all courses with filters)
router.get('/', courseController.getCourses);

// POST /api/courses
router.post('/', courseController.createCourse);

// ==========================================
// 3. Sub-Resource UUID Routes
// ==========================================

// GET /api/courses/:uuid/meta (Lightweight fetch for lists)
router.get('/:uuid/meta', courseController.getCourseMeta);

// GET /api/courses/:uuid/rights (RBAC check for the current user)
router.get('/:uuid/rights', courseController.getCourseUserRights);

// POST /api/courses/:uuid/clone (Duplicate a course)
router.post('/:uuid/clone', courseController.cloneCourse);

// POST /api/courses/:uuid/publish (Publish a course)
router.post('/:uuid/publish', courseController.publishCourse);

// POST /api/courses/:uuid/archive (Archive a course)
router.post('/:uuid/archive', courseController.archiveCourse);

// ==========================================
// 4. Root Parameter Routes (Must be LAST)
// ==========================================

// GET /api/courses/:uuid
router.get('/:uuid', courseController.getCourse);

// PATCH /api/courses/:uuid
router.patch('/:uuid', courseController.updateCourse);

// DELETE /api/courses/:uuid
router.delete('/:uuid', courseController.deleteCourse);

// GET /api/courses/id/:id (Lookup by raw MongoDB ObjectId instead of UUID)
router.get('/id/:id', courseController.getCourseById);

export default router;