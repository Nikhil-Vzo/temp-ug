import { type Request, type Response } from 'express';
import { catchAsync } from '../config/CatchAsync.js';
import * as assignmentService from '../services/assignment-service.js';

// ==========================================
// 1. Create Assignment
// ==========================================
export const createAssignment = catchAsync(async (req: any, res: Response) => {
  const { lessonId } = req.params;
  const { title, instructions } = req.body;

  const assignment = await assignmentService.create_assignment(lessonId, title, instructions);

  res.status(201).json({
    status: 'success',
    data: { assignment }
  });
});

// ==========================================
// 2. Submit Assignment Responses
// ==========================================
export const submitAssignment = catchAsync(async (req: any, res: Response) => {
  const { assignmentId } = req.params;
  const userId = req.user?.id || req.body.userId || "6a2fde02acf82e9382a4ad9b";
  const { submissionUrl } = req.body;

  const submission = await assignmentService.submit_assignment(userId, assignmentId, submissionUrl);

  res.status(201).json({
    status: 'success',
    data: { submission }
  });
});

// ==========================================
// 3. Grade Student Submission (Instructor only)
// ==========================================
export const gradeSubmission = catchAsync(async (req: any, res: Response) => {
  const { submissionId } = req.params;
  const { score, remarks } = req.body;

  const submission = await assignmentService.grade_assignment(submissionId, score, remarks);

  res.status(200).json({
    status: 'success',
    data: { submission }
  });
});

// ==========================================
// 4. Get Submissions Results list
// ==========================================
export const getAssignmentResults = catchAsync(async (req: any, res: Response) => {
  const { assignmentId } = req.params;

  const results = await assignmentService.get_assignment_results(assignmentId);

  res.status(200).json({
    status: 'success',
    results: results.length,
    data: { results }
  });
});
