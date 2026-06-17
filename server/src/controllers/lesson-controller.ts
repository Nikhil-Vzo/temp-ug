import { type Request, type Response } from 'express';
import { catchAsync } from '../config/CatchAsync.js';
import * as lessonService from '../services/lesson-service.js';

// ==========================================
// 1. Create Lesson
// ==========================================
export const createLesson = catchAsync(async (req: any, res: Response) => {
  const { moduleId } = req.params;
  const { title, lessonType } = req.body;

  const newLesson = await lessonService.create_lesson(moduleId, title, lessonType);

  res.status(201).json({
    status: 'success',
    data: { lesson: newLesson }
  });
});

// ==========================================
// 2. Get Lesson Details
// ==========================================
export const getLesson = catchAsync(async (req: any, res: Response) => {
  const { lessonId } = req.params;

  const lesson = await lessonService.get_lesson(lessonId);

  res.status(200).json({
    status: 'success',
    data: { lesson }
  });
});

// ==========================================
// 3. Update Lesson
// ==========================================
export const updateLesson = catchAsync(async (req: any, res: Response) => {
  const { lessonId } = req.params;

  const updatedLesson = await lessonService.update_lesson(lessonId, req.body);

  res.status(200).json({
    status: 'success',
    data: { lesson: updatedLesson }
  });
});

// ==========================================
// 4. Delete Lesson
// ==========================================
export const deleteLesson = catchAsync(async (req: any, res: Response) => {
  const { lessonId } = req.params;

  await lessonService.delete_lesson(lessonId);

  res.status(204).send(); // 204 No Content
});
