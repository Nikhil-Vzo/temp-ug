import { type Request, type Response } from 'express';
import { catchAsync } from '../config/CatchAsync.js';
import * as sectionService from '../services/section-service.js';

// ==========================================
// 1. Create Section
// ==========================================
export const createSection = catchAsync(async (req: any, res: Response) => {
  const courseId = req.params.courseId as string;
  const { title } = req.body;

  const newSection = await sectionService.create_section(courseId, title);

  res.status(201).json({
    status: 'success',
    data: { section: newSection }
  });
});

// ==========================================
// 2. Get Sections for Course
// ==========================================
export const getSections = catchAsync(async (req: any, res: Response) => {
  const courseId = req.params.courseId as string;

  const sections = await sectionService.get_sections(courseId);

  res.status(200).json({
    status: 'success',
    results: sections.length,
    data: { sections }
  });
});

// ==========================================
// 3. Update Section
// ==========================================
export const updateSection = catchAsync(async (req: any, res: Response) => {
  const sectionId = req.params.sectionId as string;
  const { title } = req.body;

  const updatedSection = await sectionService.update_section(sectionId, title);

  res.status(200).json({
    status: 'success',
    data: { section: updatedSection }
  });
});

// ==========================================
// 4. Delete Section
// ==========================================
export const deleteSection = catchAsync(async (req: any, res: Response) => {
  const sectionId = req.params.sectionId as string;

  await sectionService.delete_section(sectionId);

  res.status(204).send(); // 204 No Content
});
