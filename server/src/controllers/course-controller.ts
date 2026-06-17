import {type Request,type Response } from 'express';
import * as courseService from '../services/course-service.js';
import { catchAsync } from '../config/CatchAsync.js';

// ==========================================
// 1. Create Course
// ==========================================
export const createCourse = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id || "6a2fde02acf82e9382a4ad9b";
  
  const newCourse = await courseService.create_course(req.body, userId);

  res.status(201).json({
    status: 'success',
    data: { course: newCourse }
  });
});

// ==========================================
// 2. Get Course (Full Details by UUID)
// ==========================================
export const getCourse = catchAsync(async (req: any, res: Response) => {
  const { uuid } = req.params;
  const course = await courseService.get_course(uuid);

  res.status(200).json({
    status: 'success',
    data: { course }
  });
});

// ==========================================
// 3. Get Course By MongoDB ID
// ==========================================
export const getCourseById = catchAsync(async (req: any, res: Response) => {
  const { id } = req.params;
  const course = await courseService.get_course_by_id(id);

  res.status(200).json({
    status: 'success',
    data: { course }
  });
});

// ==========================================
// 4. Get Course Meta (Lightweight & Cached)
// ==========================================
export const getCourseMeta = catchAsync(async (req: any, res: Response) => {
  const { uuid } = req.params;
  const courseMeta = await courseService.get_course_meta(uuid);

  res.status(200).json({
    status: 'success',
    data: { courseMeta }
  });
});

// ==========================================
// 5. Get All Courses (with filters)
// ==========================================
export const getCourses = catchAsync(async (req: any, res: Response) => {
  const { category, difficulty } = req.query;
  const skip = parseInt(req.query.skip as string) || 0;
  const limit = parseInt(req.query.limit as string) || 20;

  const courses = await courseService.get_courses({ category, difficulty }, skip, limit);

  res.status(200).json({
    status: 'success',
    results: courses.length,
    data: { courses }
  });
});

// ==========================================
// 6. Get Courses By Organization Slug
// ==========================================
export const getCoursesByOrgSlug = catchAsync(async (req: any, res: Response) => {
  const { slug } = req.params;
  const skip = parseInt(req.query.skip as string) || 0;
  const limit = parseInt(req.query.limit as string) || 20;

  const courses = await courseService.get_courses_orgslug(slug, skip, limit);

  res.status(200).json({
    status: 'success',
    results: courses.length,
    data: { courses }
  });
});

// ==========================================
// 6. Get Courses Count By Org Slug
// ==========================================
export const getCoursesCountByOrgSlug = catchAsync(async (req: any, res: Response) => {
  const { slug } = req.params;
  const count = await courseService.get_courses_count_orgslug(slug);

  res.status(200).json({
    status: 'success',
    data: { count }
  });
});

// ==========================================
// 7. Update Course
// ==========================================
export const updateCourse = catchAsync(async (req: any, res: Response) => {
  const { uuid } = req.params;
  const updatedCourse = await courseService.update_course(uuid, req.body);

  res.status(200).json({
    status: 'success',
    data: { course: updatedCourse }
  });
});

// ==========================================
// 8. Delete Course
// ==========================================
export const deleteCourse = catchAsync(async (req: any, res: Response) => {
  const { uuid } = req.params;
  await courseService.delete_course(uuid);

  res.status(204).send(); // 204 No Content
});

// ==========================================
// 9. Search Courses (Within an Org)
// ==========================================
// Endpoint: GET /api/courses/search?orgId=123&q=typescript
export const searchCourses = catchAsync(async (req: any, res: Response) => {
  const { orgId, q } = req.query;

  if (!orgId || !q) {
    return res.status(400).json({
      status: 'fail',
      message: 'Both orgId and q (search query) are required parameters.'
    });
  }

  const courses = await courseService.search_courses(orgId as string, q as string);

  res.status(200).json({
    status: 'success',
    results: courses.length,
    data: { courses }
  });
});

// ==========================================
// 10. Get Course User Rights (RBAC Check)
// ==========================================
export const getCourseUserRights = catchAsync(async (req: any, res: Response) => {
  const { uuid } = req.params;
  const userId = req.user?.id || "6a2fde02acf82e9382a4ad9b";

  const rights = await courseService.get_course_user_rights(uuid, userId);

  res.status(200).json({
    status: 'success',
    data: { rights }
  });
});

// ==========================================
// 11. Clone Course
// ==========================================
export const cloneCourse = catchAsync(async (req: any, res: Response) => {
  const { uuid } = req.params;
  const userId = req.user?.id || "6a2fde02acf82e9382a4ad9b";

  const clonedCourse = await courseService.clone_course(uuid, userId);

  res.status(201).json({
    status: 'success',
    data: { course: clonedCourse }
  });
});

// ==========================================
// 12. Publish Course
// ==========================================
export const publishCourse = catchAsync(async (req: any, res: Response) => {
  const { uuid } = req.params;
  const course = await courseService.publish_course(uuid);

  res.status(200).json({
    status: 'success',
    data: { course }
  });
});

// ==========================================
// 13. Archive Course
// ==========================================
export const archiveCourse = catchAsync(async (req: any, res: Response) => {
  const { uuid } = req.params;
  const course = await courseService.archive_course(uuid);

  res.status(200).json({
    status: 'success',
    data: { course }
  });
});