import mongoose from 'mongoose';
import { AppError } from '../config/CatchAsync.js';
import Progress from '../models/Progress.js';
import Activity from '../models/Activity.js';
import Module from '../models/Module.js';
import Chapter from '../models/Chapter.js';
import Course from '../models/Course.js';
import { publishEvent } from './event-bus.js';

const findCourseIdByLesson = async (lessonObjectId: mongoose.Types.ObjectId) => {
  const moduleDoc = await Module.findOne({ activities: lessonObjectId }).lean();
  if (!moduleDoc) throw new AppError(`Lesson ${lessonObjectId} is not bound to any module`, 404);

  const chapterDoc = await Chapter.findOne({ _id: moduleDoc.section_id }).lean();
  if (!chapterDoc) throw new AppError(`Module ${moduleDoc._id} is not bound to any section`, 404);

  return chapterDoc.course_id;
};

export const start_lesson = async (userId: string, lessonIdOrUuid: string) => {
  const query = mongoose.Types.ObjectId.isValid(lessonIdOrUuid)
    ? { _id: lessonIdOrUuid }
    : { activity_uuid: lessonIdOrUuid };

  const lesson = await Activity.findOne(query).lean();
  if (!lesson) throw new AppError('Lesson not found', 404);

  const courseId = await findCourseIdByLesson(lesson._id as mongoose.Types.ObjectId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  let progress = await Progress.findOne({ user_id: userObjectId, lesson_id: lesson._id });
  if (!progress) {
    progress = await Progress.create({
      user_id: userObjectId,
      lesson_id: lesson._id,
      course_id: courseId,
      started_at: new Date()
    });
  }

  publishEvent('LESSON_STARTED', {
    userId,
    lessonId: lesson._id.toString(),
    lessonTitle: lesson.title,
    courseId: courseId.toString()
  });

  return progress;
};

export const update_progress = async (
  userId: string,
  lessonIdOrUuid: string,
  lastPosition: number,
  completionPercentage: number
) => {
  const query = mongoose.Types.ObjectId.isValid(lessonIdOrUuid)
    ? { _id: lessonIdOrUuid }
    : { activity_uuid: lessonIdOrUuid };

  const lesson = await Activity.findOne(query).lean();
  if (!lesson) throw new AppError('Lesson not found', 404);

  const userObjectId = new mongoose.Types.ObjectId(userId);

  let progress = await Progress.findOne({ user_id: userObjectId, lesson_id: lesson._id });
  if (!progress) {
    const courseId = await findCourseIdByLesson(lesson._id as mongoose.Types.ObjectId);
    progress = new Progress({
      user_id: userObjectId,
      lesson_id: lesson._id,
      course_id: courseId,
      started_at: new Date()
    });
  }

  progress.last_position = lastPosition;
  // never let completion_percentage go backwards
  progress.completion_percentage = Math.min(100, Math.max(progress.completion_percentage, completionPercentage));

  if (completionPercentage >= 100 && !progress.completed) {
    progress.completed = true;
    progress.completed_at = new Date();
  }

  progress.updated_at = new Date();
  await progress.save();

  if (progress.completed) {
    publishEvent('LESSON_COMPLETED', {
      userId,
      lessonId: lesson._id.toString(),
      lessonTitle: lesson.title,
      courseId: progress.course_id.toString()
    });
    await checkAndEmitCourseCompleted(userId, progress.course_id.toString());
  }

  return progress;
};

export const complete_lesson = async (userId: string, lessonIdOrUuid: string) => {
  return await update_progress(userId, lessonIdOrUuid, 0, 100);
};

export const get_course_progress = async (userId: string, courseIdOrUuid: string) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const courseQuery = mongoose.Types.ObjectId.isValid(courseIdOrUuid)
    ? { _id: courseIdOrUuid }
    : { course_uuid: courseIdOrUuid };
  const course = await Course.findOne(courseQuery).lean();
  if (!course) throw new AppError('Course not found', 404);

  const chapters = await Chapter.find({ course_id: course._id }).lean();
  const chapterIds = chapters.map(c => c._id);

  const modules = await Module.find({ section_id: { $in: chapterIds } }).lean();
  const lessonIds: mongoose.Types.ObjectId[] = [];
  modules.forEach(m => {
    if (m.activities) lessonIds.push(...(m.activities as any[]));
  });

  if (lessonIds.length === 0) return { completionPercentage: 0 };

  const completedCount = await Progress.countDocuments({
    user_id: userObjectId,
    lesson_id: { $in: lessonIds },
    completed: true
  });

  const completionPercentage = Math.round((completedCount / lessonIds.length) * 100);
  return { completionPercentage };
};

const checkAndEmitCourseCompleted = async (userId: string, courseId: string) => {
  const progressObj = await get_course_progress(userId, courseId);
  if (progressObj.completionPercentage >= 100) {
    const course = await Course.findById(courseId).lean();
    if (course) {
      publishEvent('COURSE_COMPLETED', { userId, courseId, courseTitle: course.title });
    }
  }
};
