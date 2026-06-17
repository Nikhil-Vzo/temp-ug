import mongoose from 'mongoose';
import { AppError } from '../config/CatchAsync.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import { publishEvent } from './event-bus.js';

const findCourse = async (courseIdOrUuid: string) => {
  let course;
  if (mongoose.Types.ObjectId.isValid(courseIdOrUuid)) {
    course = await Course.findById(courseIdOrUuid).lean();
  } else {
    course = await Course.findOne({ course_uuid: courseIdOrUuid }).lean();
  }
  if (!course) throw new AppError('Course not found', 404);
  return course;
};

export const enroll_course = async (userId: string, courseIdOrUuid: string) => {
  const course = await findCourse(courseIdOrUuid);

  // Return existing enrollment silently instead of throwing
  let enrollment = await Enrollment.findOne({
    user_id: new mongoose.Types.ObjectId(userId),
    course_id: course._id
  });
  if (enrollment) return enrollment;

  enrollment = await Enrollment.create({
    user_id: new mongoose.Types.ObjectId(userId),
    course_id: course._id
  });

  publishEvent('COURSE_ENROLLED', {
    userId,
    courseId: course._id.toString(),
    courseTitle: course.title
  });

  return enrollment;
};

export const unenroll_course = async (enrollmentIdOrUuid: string, userId: string) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const query = mongoose.Types.ObjectId.isValid(enrollmentIdOrUuid)
    ? { _id: enrollmentIdOrUuid, user_id: userObjectId }
    : { enrollment_uuid: enrollmentIdOrUuid, user_id: userObjectId };

  const result = await Enrollment.deleteOne(query);
  if (result.deletedCount === 0) {
    throw new AppError('Enrollment record not found or access denied', 404);
  }

  return true;
};

export const get_my_enrollments = async (userId: string) => {
  return await Enrollment.find({ user_id: new mongoose.Types.ObjectId(userId) })
    .populate('course_id')
    .sort({ enrolled_at: -1 })
    .lean();
};

export const get_course_students = async (courseIdOrUuid: string) => {
  const course = await findCourse(courseIdOrUuid);
  return await Enrollment.find({ course_id: course._id })
    .populate('user_id', 'email')
    .sort({ enrolled_at: -1 })
    .lean();
};
