import { Router } from 'express';
import * as assignmentController from '../controllers/assignment-controller.js';

const router = Router();

// POST /api/v1/lessons/:lessonId/assignments
router.post('/lessons/:lessonId/assignments', assignmentController.createAssignment);

// POST /api/v1/assignments/:assignmentId/submissions
router.post('/assignments/:assignmentId/submissions', assignmentController.submitAssignment);

// POST /api/v1/submissions/:submissionId/grade
router.post('/submissions/:submissionId/grade', assignmentController.gradeSubmission);

// GET /api/v1/assignments/:assignmentId/results
router.get('/assignments/:assignmentId/results', assignmentController.getAssignmentResults);

// PATCH /api/v1/assignments/:assignmentId
router.patch('/assignments/:assignmentId', assignmentController.updateAssignment);

// GET /api/v1/assignments/:assignmentId/my-submission
router.get('/assignments/:assignmentId/my-submission', assignmentController.getMySubmission);

export default router;
