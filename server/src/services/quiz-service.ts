import mongoose from 'mongoose';
import { AppError } from '../config/CatchAsync.js';
import Quiz from '../models/Quiz.js';
import QuizSubmission from '../models/QuizSubmission.js';
import Activity from '../models/Activity.js';
import { publishEvent } from './event-bus.js';

const findLesson = async (lessonIdOrUuid: string) => {
  let lesson;
  if (mongoose.Types.ObjectId.isValid(lessonIdOrUuid)) {
    lesson = await Activity.findById(lessonIdOrUuid).lean();
  } else {
    lesson = await Activity.findOne({ activity_uuid: lessonIdOrUuid }).lean();
  }
  if (!lesson) throw new AppError('Lesson not found', 404);
  return lesson;
};

const findQuiz = async (quizIdOrUuid: string, session?: any) => {
  let quiz;
  if (mongoose.Types.ObjectId.isValid(quizIdOrUuid)) {
    quiz = await Quiz.findById(quizIdOrUuid).session(session);
  } else {
    quiz = await Quiz.findOne({ quiz_uuid: quizIdOrUuid }).session(session);
  }
  if (!quiz) throw new AppError('Quiz not found', 404);
  return quiz;
};

export const create_quiz = async (lessonIdOrUuid: string, title: string, passingScore: number = 70) => {
  const lesson = await findLesson(lessonIdOrUuid);

  const existing = await Quiz.findOne({ lesson_id: lesson._id });
  if (existing) throw new AppError('Quiz already exists for this lesson', 400);

  return await Quiz.create({ lesson_id: lesson._id, title, passing_score: passingScore, questions: [] });
};

export const add_question = async (
  quizIdOrUuid: string,
  text: string,
  options: string[],
  correctOptionIndex: number
) => {
  const quiz = await findQuiz(quizIdOrUuid);
  quiz.questions.push({ text, options, correct_option_index: correctOptionIndex });
  await quiz.save();
  return quiz;
};

export const get_quiz = async (quizIdOrUuid: string) => {
  const isId = mongoose.Types.ObjectId.isValid(quizIdOrUuid);
  const matchQuery = isId
    ? { _id: new mongoose.Types.ObjectId(quizIdOrUuid) }
    : { quiz_uuid: quizIdOrUuid };

  const quiz = await Quiz.findOne(matchQuery).lean();
  if (!quiz) throw new AppError('Quiz not found', 404);

  // Strip correct_option_index so students can't read answers from the response
  const sanitisedQuestions = quiz.questions.map((q: any) => ({
    question_uuid: q.question_uuid,
    text: q.text,
    options: q.options
  }));

  return { ...quiz, questions: sanitisedQuestions };
};

export const start_quiz = async (userId: string, quizIdOrUuid: string) => {
  const quiz = await findQuiz(quizIdOrUuid);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  return await QuizSubmission.create({
    quiz_id: quiz._id,
    user_id: userObjectId,
    status: 'started',
    started_at: new Date()
  });
};

export const submit_quiz = async (
  userId: string,
  quizIdOrUuid: string,
  answers: { questionUuid: string; selectedOptionIndex: number }[]
) => {
  const quiz = await findQuiz(quizIdOrUuid);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  let submission = await QuizSubmission.findOne({
    quiz_id: quiz._id,
    user_id: userObjectId,
    status: 'started'
  });

  if (!submission) {
    submission = new QuizSubmission({
      quiz_id: quiz._id,
      user_id: userObjectId,
      started_at: new Date()
    });
  }

  let correctCount = 0;
  const processedAnswers = answers.map(ans => {
    const question = quiz.questions.find(
      (q: any) => q.question_uuid.toString() === ans.questionUuid
    );
    const isCorrect = question && question.correct_option_index === ans.selectedOptionIndex;
    if (isCorrect) correctCount++;
    return {
      question_uuid: ans.questionUuid,
      selected_option_index: ans.selectedOptionIndex
    };
  });

  const totalQuestions = quiz.questions.length || 1;
  const score = Math.round((correctCount / totalQuestions) * 100);
  const passed = score >= quiz.passing_score;

  submission.answers = processedAnswers as any;
  submission.score = score;
  submission.passed = passed;
  submission.status = 'completed';
  submission.submitted_at = new Date();
  await submission.save();

  if (passed) {
    publishEvent('QUIZ_PASSED', {
      userId,
      quizId: quiz._id.toString(),
      quizTitle: quiz.title,
      score
    });
  }

  return submission;
};

export const get_quiz_result = async (userId: string, quizIdOrUuid: string) => {
  const quiz = await findQuiz(quizIdOrUuid);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const submission = await QuizSubmission.findOne({
    quiz_id: quiz._id,
    user_id: userObjectId,
    status: 'completed'
  })
    .sort({ submitted_at: -1 })
    .lean();

  if (!submission) throw new AppError('No completed attempts found for this quiz', 404);

  return {
    score: submission.score,
    passed: submission.passed,
    submittedAt: submission.submitted_at
  };
};
