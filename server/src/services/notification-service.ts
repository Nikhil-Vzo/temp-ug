import { AppError } from '../config/CatchAsync.js';
import Notification from '../models/Notification.js';

export const handleCourseEnrolled = async (data: { userId: string; courseId: string; courseTitle: string }) => {
  await Notification.create({
    user_id: data.userId,
    title: 'Enrolled in Course!',
    message: `You have successfully enrolled in the course: ${data.courseTitle || 'New Course'}.`
  });
};

export const handleLessonCompleted = async (data: { userId: string; lessonId: string; lessonTitle: string }) => {
  await Notification.create({
    user_id: data.userId,
    title: 'Lesson Completed!',
    message: `Great job! You completed the lesson: ${data.lessonTitle || 'Lesson'}.`
  });
};

export const handleQuizPassed = async (data: { userId: string; quizId: string; quizTitle: string; score: number }) => {
  await Notification.create({
    user_id: data.userId,
    title: 'Quiz Passed!',
    message: `Congratulations! You passed the quiz "${data.quizTitle || 'Quiz'}" with a score of ${data.score}%.`
  });
};

export const handleAssignmentSubmitted = async (data: { userId: string; assignmentId: string; assignmentTitle: string }) => {
  await Notification.create({
    user_id: data.userId,
    title: 'Assignment Submitted!',
    message: `Your submission for "${data.assignmentTitle || 'Assignment'}" has been received.`
  });
};

export const handleCourseCompleted = async (data: { userId: string; courseId: string; courseTitle: string }) => {
  await Notification.create({
    user_id: data.userId,
    title: 'Course Completed!',
    message: `Hooray! You have finished the course: ${data.courseTitle || 'Course'}. Keep up the amazing work!`
  });
};

export const handleCertificateGenerated = async (data: { userId: string; courseId: string; certificateCode: string }) => {
  await Notification.create({
    user_id: data.userId,
    title: 'Certificate Issued!',
    message: `Your completion certificate has been generated! Code: ${data.certificateCode}.`
  });
};

export const get_notifications = async (userId: string) => {
  return await Notification.find({ user_id: userId })
    .sort({ created_at: -1 })
    .lean();
};

export const mark_read = async (notificationUuid: string, userId: string) => {
  const updatedNotification = await Notification.findOneAndUpdate(
    { notification_uuid: notificationUuid, user_id: userId },
    { $set: { is_read: true } },
    { new: true }
  ).lean();

  if (!updatedNotification) {
    throw new AppError('Notification not found or access denied', 404);
  }

  return updatedNotification;
};
