import { Router } from 'express';
import * as enrollmentController from '../controllers/enrollment-controller.js';

const router = Router();

// POST /api/v1/courses/:courseId/enroll
router.post('/courses/:courseId/enroll', enrollmentController.enrollCourse);

// POST /api/v1/courses/enroll
router.post('/courses/enroll', enrollmentController.enrollCourse);

// DELETE /api/v1/enrollments/:enrollmentId
router.delete('/enrollments/:enrollmentId', enrollmentController.unenroll);

// GET /api/v1/users/me/enrollments
router.get('/users/me/enrollments', enrollmentController.getMyEnrollments);

// GET /api/v1/courses/:courseId/students
router.get('/courses/:courseId/students', enrollmentController.getCourseStudents);

export default router;
