import { type Request, type Response } from 'express';
import { catchAsync, AppError } from '../config/CatchAsync.js';
import * as enrollmentService from '../services/enrollment-service.js';

// ==========================================
// 1. Enroll in Course
// ==========================================
export const enrollCourse = catchAsync(async (req: any, res: Response) => {
  const courseId = req.params.courseId || req.body.courseId;
  if (!courseId) {
    throw new AppError('Please provide courseId', 400);
  }
  
  // Use authenticated user ID or request body fallback for local development / testing
  const userId = req.user?.id || req.body.userId || "6a2fde02acf82e9382a4ad9b";

  const enrollment = await enrollmentService.enroll_course(userId, courseId);

  res.status(201).json({
    status: 'success',
    data: { enrollment }
  });
});

// ==========================================
// 2. Unenroll from Course
// ==========================================
export const unenroll = catchAsync(async (req: any, res: Response) => {
  const { enrollmentId } = req.params;
  const userId = req.user?.id || req.body.userId || "6a2fde02acf82e9382a4ad9b";

  await enrollmentService.unenroll_course(enrollmentId, userId);

  res.status(204).send(); // 204 No Content
});

// ==========================================
// 3. Get My Enrollments
// ==========================================
export const getMyEnrollments = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id || "6a2fde02acf82e9382a4ad9b";

  const enrollments = await enrollmentService.get_my_enrollments(userId);

  res.status(200).json({
    status: 'success',
    results: enrollments.length,
    data: { enrollments }
  });
});

// ==========================================
// 4. Get Course Students (Instructor only)
// ==========================================
export const getCourseStudents = catchAsync(async (req: any, res: Response) => {
  const { courseId } = req.params;

  const students = await enrollmentService.get_course_students(courseId);

  res.status(200).json({
    status: 'success',
    results: students.length,
    data: { students }
  });
});
