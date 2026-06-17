import mongoose from 'mongoose';
import { AppError } from '../config/CatchAsync.js';
import Certificate from '../models/Certificate.js';
import Course from '../models/Course.js';
import Chapter from '../models/Chapter.js';
import Module from '../models/Module.js';
import Progress from '../models/Progress.js';
import { publishEvent } from './event-bus.js';

const generateCode = () => {
  const part1 = Math.random().toString(36).substring(2, 8).toUpperCase();
  const part2 = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${part1}-${part2}`;
};

export const generate_certificate = async (userId: string, courseId: string) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const courseObjectId = new mongoose.Types.ObjectId(courseId);

  const existingCert = await Certificate.findOne({ user_id: userObjectId, course_id: courseObjectId }).lean();
  if (existingCert) return existingCert;

  const course = await Course.findById(courseObjectId).lean();
  if (!course) throw new AppError('Course not found', 404);

  const chapters = await Chapter.find({ course_id: courseObjectId }).lean();
  const chapterIds = chapters.map(c => c._id);

  const modules = await Module.find({ section_id: { $in: chapterIds } }).lean();
  const activityIds: mongoose.Types.ObjectId[] = [];
  modules.forEach(m => {
    if (m.activities) activityIds.push(...(m.activities as any[]));
  });

  if (activityIds.length === 0) {
    throw new AppError('Cannot generate a certificate for a course with no content', 400);
  }

  const completedCount = await Progress.countDocuments({
    user_id: userObjectId,
    lesson_id: { $in: activityIds },
    completed: true
  });

  if (completedCount < activityIds.length) {
    throw new AppError(
      `Course is not complete. Student has finished ${completedCount} out of ${activityIds.length} lessons.`,
      400
    );
  }

  const certificateCode = generateCode();
  const certificate = await Certificate.create({
    user_id: userObjectId,
    course_id: courseObjectId,
    certificate_code: certificateCode
  });

  publishEvent('CERTIFICATE_GENERATED', {
    userId,
    courseId,
    courseTitle: course.title,
    certificateCode
  });

  return certificate;
};

export const get_my_certificates = async (userId: string) => {
  return await Certificate.find({ user_id: userId })
    .populate('course_id', 'title')
    .sort({ issued_at: -1 })
    .lean();
};

export const verify_certificate = async (code: string) => {
  const cleanCode = code.trim().toUpperCase();
  const certificate = await Certificate.findOne({ certificate_code: cleanCode })
    .populate('user_id', 'email')
    .populate('course_id', 'title')
    .lean();

  if (!certificate) throw new AppError('Invalid certificate verification code', 404);
  return certificate;
};
