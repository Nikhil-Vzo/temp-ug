import { AppError } from "../config/CatchAsync.js";
import { CacheService } from "../core/cache/cacheClient.js";
import { CACHE_KEYS } from "../core/cache/CacheKeys.js";
import Course from "../models/Course.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";

interface CreateCourseInput {
  org_id: string;
  title: string;
  public?: boolean;
  published?: boolean;
}

export const create_course = async (courseData: CreateCourseInput, userId: string) => {
  const newCourse = await Course.create({
    ...courseData,
    chapters: [],
    authors: [{ user_id: userId, role: 'instructor' }]
  });
  await CacheService.invalidateCoursesList(courseData.org_id);
  return newCourse;
};

export const get_course = async (courseUuid: string) => {
  const course = await Course.findOne({ course_uuid: courseUuid })
    .populate('org_id', 'name slug explore')
    .populate('chapters')
    .populate('authors.user_id', 'email')
    .lean();
  if (!course) throw new AppError('Course not found', 404);
  return course;
};

export const get_course_by_id = async (courseId: string) => {
  const course = await Course.findById(courseId).lean();
  if (!course) throw new AppError('Course not found', 404);
  return course;
};

export const get_course_meta = async (courseUuid: string) => {
  const cacheKey = CACHE_KEYS.courseMeta(courseUuid);
  const cachedMeta = await CacheService.get(cacheKey);
  if (cachedMeta) return cachedMeta;

  const courseMeta = await Course.findOne(
    { course_uuid: courseUuid },
    { title: 1, public: 1, published: 1, org_id: 1, course_uuid: 1 }
  ).lean();
  if (!courseMeta) throw new AppError('Course not found', 404);

  await CacheService.set(cacheKey, courseMeta, 3600);
  return courseMeta;
};

export const get_courses = async (
  filters: { category?: string; difficulty?: string },
  skip: number = 0,
  limit: number = 20
) => {
  const query: any = {};

  if (filters.category) {
    query.category = { $regex: new RegExp('^' + filters.category + '$', 'i') };
  }
  if (filters.difficulty) {
    query.difficulty = filters.difficulty.toLowerCase();
  }

  return await Course.find(query)
    .populate('authors.user_id', 'email')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const get_courses_orgslug = async (orgSlug: string, skip: number = 0, limit: number = 20) => {
  const org = await Organization.findOne({ slug: orgSlug }, { _id: 1 }).lean();
  if (!org) throw new AppError('Organization not found', 404);

  return await Course.find({ org_id: org._id })
    .populate('authors.user_id', 'email')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const get_courses_count_orgslug = async (orgSlug: string) => {
  const org = await Organization.findOne({ slug: orgSlug }, { _id: 1 }).lean();
  if (!org) throw new AppError('Organization not found', 404);
  return await Course.countDocuments({ org_id: org._id });
};

export const update_course = async (courseUuid: string, updateData: any) => {
  const payload = { ...updateData, updated_at: new Date() };

  const updatedCourse = await Course.findOneAndUpdate(
    { course_uuid: courseUuid },
    { $set: payload },
    { new: true, runValidators: true }
  ).lean();
  if (!updatedCourse) throw new AppError('Course not found', 404);

  await CacheService.invalidateCourseMeta(courseUuid);
  if (updatedCourse.org_id) {
    await CacheService.invalidateCoursesList(updatedCourse.org_id.toString());
  }

  return updatedCourse;
};

export const delete_course = async (courseUuid: string) => {
  const course = await Course.findOne({ course_uuid: courseUuid }).lean();
  if (!course) throw new AppError('Course not found', 404);

  await Course.deleteOne({ _id: course._id });

  await CacheService.invalidateCourseMeta(courseUuid);
  if (course.org_id) {
    await CacheService.invalidateCoursesList(course.org_id.toString());
  }

  return true;
};

export const search_courses = async (orgObjectId: string, searchQuery: string) => {
  return await Course.find({
    org_id: orgObjectId,
    title: { $regex: searchQuery, $options: 'i' }
  })
    .limit(10)
    .lean();
};

export const get_course_user_rights = async (courseUuid: string, userObjectId: string) => {
  const course = await Course.findOne({ course_uuid: courseUuid }, { org_id: 1, authors: 1 }).lean();
  if (!course) throw new AppError('Course not found', 404);

  // Check if explicitly listed as author/contributor on this course
  const courseAuthorRecord = course.authors.find(
    (a: any) => a.user_id.toString() === userObjectId.toString()
  );
  if (courseAuthorRecord) {
    return { hasAccess: true, role: courseAuthorRecord.role, source: 'course_level' };
  }

  // Fall back to org-level membership check
  const user = await User.findById(userObjectId)
    .populate({ path: 'memberships.role_id', select: 'name permissions' })
    .lean();
  if (!user) throw new AppError('User not found', 404);

  const orgMembership = user.memberships.find(
    (m: any) => m.org_id && course.org_id && m.org_id.toString() === course.org_id.toString()
  );
  if (!orgMembership) {
    return { hasAccess: false, role: null, source: 'none' };
  }

  return {
    hasAccess: true,
    role: (orgMembership.role_id as any).name,
    permissions: (orgMembership.role_id as any).permissions,
    source: 'org_level'
  };
};

export const clone_course = async (courseUuid: string, userId: string) => {
  const originalCourse = await Course.findOne({ course_uuid: courseUuid }).lean();
  if (!originalCourse) throw new AppError('Course not found', 404);

  const { _id, course_uuid, created_at, updated_at, chapters, ...courseData } = originalCourse as any;

  const clonedData = {
    ...courseData,
    title: `${courseData.title} (Copy)`,
    public: false,
    published: false,
    chapters: [],
    authors: [{ user_id: userId, role: 'instructor' }]
  };

  const clonedCourse = await Course.create(clonedData);
  if (clonedCourse.org_id) {
    await CacheService.invalidateCoursesList(clonedCourse.org_id.toString());
  }

  return clonedCourse;
};

export const publish_course = async (courseUuid: string) => {
  return await update_course(courseUuid, { published: true });
};

export const archive_course = async (courseUuid: string) => {
  return await update_course(courseUuid, { published: false });
};