import { type Request, type Response } from 'express';
import { catchAsync } from '../config/CatchAsync.js';
import * as quizService from '../services/quiz-service.js';

// ==========================================
// 1. Create Quiz
// ==========================================
export const createQuiz = catchAsync(async (req: any, res: Response) => {
  const { lessonId } = req.params;
  const { title, passingScore } = req.body;

  const quiz = await quizService.create_quiz(lessonId, title, passingScore);

  res.status(201).json({
    status: 'success',
    data: { quiz }
  });
});

// ==========================================
// 2. Add Question
// ==========================================
export const addQuestion = catchAsync(async (req: any, res: Response) => {
  const { quizId } = req.params;
  const { text, options, correctOptionIndex } = req.body;

  const quiz = await quizService.add_question(quizId, text, options, correctOptionIndex);

  res.status(201).json({
    status: 'success',
    data: { quiz }
  });
});

// ==========================================
// 3. Get Quiz (Sanitised)
// ==========================================
export const getQuiz = catchAsync(async (req: any, res: Response) => {
  const { quizId } = req.params;

  const quiz = await quizService.get_quiz(quizId);

  res.status(200).json({
    status: 'success',
    data: { quiz }
  });
});

// ==========================================
// 4. Start Quiz Attempt
// ==========================================
export const startQuiz = catchAsync(async (req: any, res: Response) => {
  const { quizId } = req.params;
  const userId = req.user?.id || req.body.userId || "6a2fde02acf82e9382a4ad9b";

  const submission = await quizService.start_quiz(userId, quizId);

  res.status(201).json({
    status: 'success',
    data: { submission }
  });
});

// ==========================================
// 5. Submit Quiz Responses
// ==========================================
export const submitQuiz = catchAsync(async (req: any, res: Response) => {
  const { quizId } = req.params;
  const userId = req.user?.id || req.body.userId || "6a2fde02acf82e9382a4ad9b";
  const { answers } = req.body;

  const submission = await quizService.submit_quiz(userId, quizId, answers);

  res.status(200).json({
    status: 'success',
    data: { submission }
  });
});

// ==========================================
// 6. Get Quiz Attempt Results
// ==========================================
export const getQuizResult = catchAsync(async (req: any, res: Response) => {
  const { quizId } = req.params;
  const userId = req.user?.id || req.query.userId || "6a2fde02acf82e9382a4ad9b";

  const result = await quizService.get_quiz_result(userId as string, quizId);

  res.status(200).json({
    status: 'success',
    data: { result }
  });
});

// ==========================================
// 7. Get Full Quiz (Instructor View)
// ==========================================
export const getQuizAdmin = catchAsync(async (req: any, res: Response) => {
  const { quizId } = req.params;

  const quiz = await quizService.get_quiz_admin(quizId);

  res.status(200).json({
    status: 'success',
    data: { quiz }
  });
});

// ==========================================
// 8. Get Quiz by Lesson
// ==========================================
export const getQuizByLesson = catchAsync(async (req: any, res: Response) => {
  const { lessonId } = req.params;

  const quiz = await quizService.get_quiz_by_lesson(lessonId);

  res.status(200).json({
    status: 'success',
    data: { quiz }
  });
});

// ==========================================
// 9. Update Quiz (Questions, Title, passingScore)
// ==========================================
export const updateQuiz = catchAsync(async (req: any, res: Response) => {
  const { quizId } = req.params;
  const { title, passingScore, questions } = req.body;

  const quiz = await quizService.update_quiz(quizId, { title, passing_score: passingScore, questions });

  res.status(200).json({
    status: 'success',
    data: { quiz }
  });
});
