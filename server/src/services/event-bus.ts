import { EventEmitter } from 'node:events';
import * as rewardService from './reward-service.js';
import * as notificationService from './notification-service.js';
import * as analyticsService from './analytics-service.js';

export interface CourseEnrolledPayload {
  userId: string;
  courseId: string;
  courseTitle: string;
}

export interface LessonStartedPayload {
  userId: string;
  lessonId: string;
  lessonTitle: string;
  courseId: string;
}

export interface LessonCompletedPayload {
  userId: string;
  lessonId: string;
  lessonTitle: string;
  courseId: string;
}

export interface QuizPassedPayload {
  userId: string;
  quizId: string;
  quizTitle: string;
  score: number;
}

export interface AssignmentSubmittedPayload {
  userId: string;
  assignmentId: string;
  assignmentTitle: string;
}

export interface CourseCompletedPayload {
  userId: string;
  courseId: string;
  courseTitle: string;
}

export interface CertificateGeneratedPayload {
  userId: string;
  courseId: string;
  courseTitle: string;
  certificateCode: string;
}

export const eventBus = new EventEmitter();

eventBus.on('COURSE_ENROLLED', async (data: CourseEnrolledPayload) => {
  try {
    await notificationService.handleCourseEnrolled(data);
    await analyticsService.handleCourseEnrolled(data);
  } catch (err) {
    console.error('[EventBus] Error handling COURSE_ENROLLED:', err);
  }
});

eventBus.on('LESSON_STARTED', async (data: LessonStartedPayload) => {
  try {
    await analyticsService.handleLessonStarted(data);
  } catch (err) {
    console.error('[EventBus] Error handling LESSON_STARTED:', err);
  }
});

eventBus.on('LESSON_COMPLETED', async (data: LessonCompletedPayload) => {
  try {
    await rewardService.handleLessonCompleted(data);
    await notificationService.handleLessonCompleted(data);
    await analyticsService.handleLessonCompleted(data);
  } catch (err) {
    console.error('[EventBus] Error handling LESSON_COMPLETED:', err);
  }
});

eventBus.on('QUIZ_PASSED', async (data: QuizPassedPayload) => {
  try {
    await rewardService.handleQuizPassed(data);
    await notificationService.handleQuizPassed(data);
    await analyticsService.handleQuizPassed(data);
  } catch (err) {
    console.error('[EventBus] Error handling QUIZ_PASSED:', err);
  }
});

eventBus.on('ASSIGNMENT_SUBMITTED', async (data: AssignmentSubmittedPayload) => {
  try {
    await notificationService.handleAssignmentSubmitted(data);
    await analyticsService.handleAssignmentSubmitted(data);
  } catch (err) {
    console.error('[EventBus] Error handling ASSIGNMENT_SUBMITTED:', err);
  }
});

eventBus.on('COURSE_COMPLETED', async (data: CourseCompletedPayload) => {
  try {
    await rewardService.handleCourseCompleted(data);
    await notificationService.handleCourseCompleted(data);
    await analyticsService.handleCourseCompleted(data);
  } catch (err) {
    console.error('[EventBus] Error handling COURSE_COMPLETED:', err);
  }
});

eventBus.on('CERTIFICATE_GENERATED', async (data: CertificateGeneratedPayload) => {
  try {
    await notificationService.handleCertificateGenerated(data);
  } catch (err) {
    console.error('[EventBus] Error handling CERTIFICATE_GENERATED:', err);
  }
});

// setImmediate ensures the emit is non-blocking
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const publishEvent = (eventType: string, data: any) => {
  setImmediate(() => {
    console.log(`[EventBus] ${eventType}`, data);
    eventBus.emit(eventType, data);
  });
};
