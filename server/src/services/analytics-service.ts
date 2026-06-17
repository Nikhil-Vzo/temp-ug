import mongoose from 'mongoose';
import { AppError } from '../config/CatchAsync.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import QuizSubmission from '../models/QuizSubmission.js';
import Certificate from '../models/Certificate.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';

// stub hooks — wire up analytics tracking here when needed
export const handleCourseEnrolled = async (data: any) => {};
export const handleLessonStarted = async (data: any) => {};
export const handleLessonCompleted = async (data: any) => {};
export const handleQuizPassed = async (data: any) => {};
export const handleCourseCompleted = async (data: any) => {};
export const handleAssignmentSubmitted = async (data: any) => {};

export const get_student_analytics = async (userId: string) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const completedLessonsCount = await Progress.countDocuments({ user_id: userObjectId, completed: true });
  const learningHours = Math.round(completedLessonsCount * 0.5 * 10) / 10;

  const coursesCompleted = await Certificate.countDocuments({ user_id: userObjectId });

  const quizScores = await QuizSubmission.aggregate([
    { $match: { user_id: userObjectId, status: 'completed' } },
    { $group: { _id: null, avgScore: { $avg: '$score' } } }
  ]);
  const averageQuizScore = quizScores.length > 0 ? Math.round(quizScores[0].avgScore) : 0;

  return { learningHours, coursesCompleted, averageQuizScore };
};

export const get_course_analytics = async (courseId: string) => {
  const courseObjectId = new mongoose.Types.ObjectId(courseId);

  const totalEnrolled = await Enrollment.countDocuments({ course_id: courseObjectId });
  const totalCompletions = await Certificate.countDocuments({ course_id: courseObjectId });

  const quizScores = await QuizSubmission.aggregate([
    { $lookup: { from: 'quizzes', localField: 'quiz_id', foreignField: '_id', as: 'quiz' } },
    { $unwind: '$quiz' },
    { $lookup: { from: 'activities', localField: 'quiz.lesson_id', foreignField: '_id', as: 'lesson' } },
    { $unwind: '$lesson' },
    { $lookup: { from: 'modules', localField: 'lesson._id', foreignField: 'activities', as: 'module' } },
    { $unwind: '$module' },
    { $lookup: { from: 'chapters', localField: 'module.section_id', foreignField: '_id', as: 'chapter' } },
    { $unwind: '$chapter' },
    { $match: { 'chapter.course_id': courseObjectId, status: 'completed', score: { $ne: null } } },
    { $group: { _id: null, avgScore: { $avg: '$score' } } }
  ]);
  const averageQuizScore = quizScores.length > 0 ? Math.round(quizScores[0].avgScore) : 0;

  return { totalEnrolled, totalCompletions, averageQuizScore };
};

export const get_instructor_dashboard = async (userId: string) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const courses = await Course.find({ 'authors.user_id': userObjectId }).lean();
  const courseIds = courses.map(c => c._id);

  const totalEnrolled = await Enrollment.countDocuments({ course_id: { $in: courseIds } });
  const totalCompletions = await Certificate.countDocuments({ course_id: { $in: courseIds } });

  return { coursesCount: courses.length, totalEnrolled, totalCompletions };
};

export const get_admin_dashboard = async () => {
  const totalUsers = await User.countDocuments();
  const totalOrgs = await Organization.countDocuments();
  const totalCourses = await Course.countDocuments();

  const totalEnrollments = await Enrollment.countDocuments();
  const totalCertificates = await Certificate.countDocuments();
  const avgCompletionRate = totalEnrollments > 0
    ? Math.round((totalCertificates / totalEnrollments) * 100)
    : 0;

  return { totalUsers, totalOrganizations: totalOrgs, totalCourses, avgCompletionRate };
};
