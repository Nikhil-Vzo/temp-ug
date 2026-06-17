import { type Request, type Response } from 'express';
import * as chapterService from '../services/chapter-service.js';
import { catchAsync } from '../config/CatchAsync.js';

// ==========================================
// 1. DEPRECATED: Get Course Chapters (Relational)
// ==========================================
export const getCourseChaptersLegacy = catchAsync(async (req: any, res: Response) => {
  const { courseId } = req.params; // Expecting MongoDB ObjectId here
  const chapters = await chapterService.DEPRECEATED_get_course_chapters(courseId);

  res.status(200).json({
    status: 'success',
    results: chapters.length,
    data: { chapters }
  });
});

// ==========================================
// 2. Create Chapter
// ==========================================
export const createChapter = catchAsync(async (req: any, res: Response) => {
  const { courseUuid } = req.params;
  const { title } = req.body;

  const newChapter = await chapterService.create_chapter(courseUuid, title);

  res.status(201).json({
    status: 'success',
    data: { chapter: newChapter }
  });
});

// ==========================================
// 3. Delete Chapter
// ==========================================
export const deleteChapter = catchAsync(async (req: any, res: Response) => {
  const { chapterUuid } = req.params;

  await chapterService.delete_chapter(chapterUuid);

  res.status(204).send(); // 204 No Content
});

// ==========================================
// 4. Get Chapter (Full Detail)
// ==========================================
export const getChapter = catchAsync(async (req: any, res: Response) => {
  const { chapterUuid } = req.params;
  
  const chapter = await chapterService.get_chapter(chapterUuid);

  res.status(200).json({
    status: 'success',
    data: { chapter }
  });
});

// ==========================================
// 5. Get Course Chapters (Preserves Array Order)
// ==========================================
export const getCourseChapters = catchAsync(async (req: any, res: Response) => {
  const { courseUuid } = req.params;

  const chapters = await chapterService.get_course_chapters(courseUuid);

  res.status(200).json({
    status: 'success',
    results: chapters.length,
    data: { chapters }
  });
});

// ==========================================
// 6. Reorder Chapters & Activities
// ==========================================
// Expected Body: { newChapterOrder: string[], chapterActivityUpdates: { chapterId: string, newActivities: string[] }[] }
export const reorderChaptersAndActivities = catchAsync(async (req: any, res: Response) => {
  const { courseUuid } = req.params;
  const { newChapterOrder, chapterActivityUpdates } = req.body;

  await chapterService.reorder_chapters_and_activities(
    courseUuid, 
    newChapterOrder, 
    chapterActivityUpdates
  );

  res.status(200).json({
    status: 'success',
    message: 'Curriculum order updated successfully'
  });
});

// ==========================================
// 7. Update Chapter
// ==========================================
export const updateChapter = catchAsync(async (req: any, res: Response) => {
  const { chapterUuid } = req.params;
  
  const updatedChapter = await chapterService.update_chapter(chapterUuid, req.body);

  res.status(200).json({
    status: 'success',
    data: { chapter: updatedChapter }
  });
});