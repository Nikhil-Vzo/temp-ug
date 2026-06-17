import { type Request, type Response } from 'express';
import { catchAsync } from '../config/CatchAsync.js';
import * as progressService from '../services/progress-service.js';

// ==========================================
// 1. Start Lesson
// ==========================================
export const startLesson = catchAsync(async (req: any, res: Response) => {
  const { lessonId } = req.params;
  const userId = req.user?.id || req.body.userId || "6a2fde02acf82e9382a4ad9b";

  const progress = await progressService.start_lesson(userId, lessonId);

  res.status(201).json({
    status: 'success',
    data: { progress }
  });
});

// ==========================================
// 2. Update Progress (Playback position & scroll metrics)
// ==========================================
export const updateProgress = catchAsync(async (req: any, res: Response) => {
  const { lessonId } = req.params;
  const userId = req.user?.id || req.body.userId || "6a2fde02acf82e9382a4ad9b";
  const { lastPosition, completionPercentage } = req.body;

  const progress = await progressService.update_progress(
    userId, 
    lessonId, 
    lastPosition || 0, 
    completionPercentage || 0
  );

  res.status(200).json({
    status: 'success',
    data: { progress }
  });
});

// ==========================================
// 3. Complete Lesson (Instant 100%)
// ==========================================
export const completeLesson = catchAsync(async (req: any, res: Response) => {
  const { lessonId } = req.params;
  const userId = req.user?.id || req.body.userId || "6a2fde02acf82e9382a4ad9b";

  const progress = await progressService.complete_lesson(userId, lessonId);

  res.status(200).json({
    status: 'success',
    data: { progress }
  });
});

// ==========================================
// 4. Get Course Progress Completeness
// ==========================================
export const getCourseProgress = catchAsync(async (req: any, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.id || req.query.userId || "6a2fde02acf82e9382a4ad9b";

  const progress = await progressService.get_course_progress(userId as string, courseId);

  res.status(200).json({
    status: 'success',
    data: progress
  });
});
