import { Router } from 'express';
import * as quizController from '../controllers/quiz-controller.js';

const router = Router();

// POST /api/v1/lessons/:lessonId/quizzes
router.post('/lessons/:lessonId/quizzes', quizController.createQuiz);

// POST /api/v1/quizzes/:quizId/questions
router.post('/quizzes/:quizId/questions', quizController.addQuestion);

// GET /api/v1/quizzes/:quizId
router.get('/quizzes/:quizId', quizController.getQuiz);

// POST /api/v1/quizzes/:quizId/start
router.post('/quizzes/:quizId/start', quizController.startQuiz);

// POST /api/v1/quizzes/:quizId/submit
router.post('/quizzes/:quizId/submit', quizController.submitQuiz);

// GET /api/v1/quizzes/:quizId/result
router.get('/quizzes/:quizId/result', quizController.getQuizResult);

export default router;
