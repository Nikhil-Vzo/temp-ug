import { runInTransaction } from '../config/database.js';
import Wallet from '../models/Wallet.js';
import RewardTransaction from '../models/RewardTransaction.js';
import { AppError } from '../config/CatchAsync.js';

const COINS_FOR_LESSON = 10;
const COINS_FOR_QUIZ = 20;
const COINS_FOR_COURSE = 50;

const creditCoins = async (userId: string, amount: number, description: string, session?: any) => {
  let wallet = await Wallet.findOne({ user_id: userId }).session(session);
  if (!wallet) {
    try {
      wallet = await Wallet.findOneAndUpdate(
        { user_id: userId },
        { $setOnInsert: { balance: 0, badges: [] } },
        { upsert: true, new: true, setDefaultsOnInsert: true, session }
      );
    } catch (error) {
      wallet = await Wallet.findOne({ user_id: userId }).session(session);
      if (!wallet) throw error;
    }
  }
  if (wallet) {
    wallet.balance += amount;
    await wallet.save({ session });
  }
  await RewardTransaction.create([{ user_id: userId, amount, description }], { session });
};

export const handleLessonCompleted = async (data: { userId: string; lessonId: string; lessonTitle: string }) => {
  await creditCoins(data.userId, COINS_FOR_LESSON, `Completed Lesson: ${data.lessonTitle || 'Lesson'}`);
};

export const handleQuizPassed = async (data: { userId: string; quizId: string; quizTitle: string; score: number }) => {
  await creditCoins(data.userId, COINS_FOR_QUIZ, `Passed Quiz: ${data.quizTitle || 'Quiz'} with score ${data.score}%`);
};

export const handleCourseCompleted = async (data: { userId: string; courseId: string; courseTitle: string }) => {
  await runInTransaction(async (session) => {
    await creditCoins(data.userId, COINS_FOR_COURSE, `Completed Course: ${data.courseTitle || 'Course'}`, session);

    let wallet = await Wallet.findOne({ user_id: data.userId }).session(session);
    if (!wallet) {
      try {
        wallet = await Wallet.findOneAndUpdate(
          { user_id: data.userId },
          { $setOnInsert: { balance: 0, badges: [] } },
          { upsert: true, new: true, setDefaultsOnInsert: true, session }
        );
      } catch (error) {
        wallet = await Wallet.findOne({ user_id: data.userId }).session(session);
        if (!wallet) throw error;
      }
    }

    const badgeName = `${data.courseTitle || 'Course'} Completionist`;
    if (wallet && !wallet.badges.some((b: any) => b.badge_name === badgeName)) {
      wallet.badges.push({ badge_name: badgeName, earned_at: new Date() });
      await wallet.save({ session });
    }
  });
};

export const get_wallet = async (userId: string) => {
  let wallet = await Wallet.findOne({ user_id: userId }).lean();
  if (!wallet) {
    try {
      const newWallet = await Wallet.findOneAndUpdate(
        { user_id: userId },
        { $setOnInsert: { balance: 0, badges: [] } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
      wallet = newWallet;
    } catch (error: any) {
      wallet = await Wallet.findOne({ user_id: userId }).lean();
      if (!wallet) throw error;
    }
  }
  return wallet;
};

export const get_transactions = async (userId: string) => {
  return await RewardTransaction.find({ user_id: userId })
    .sort({ earned_at: -1 })
    .lean();
};

export const get_badges = async (userId: string) => {
  const wallet = await get_wallet(userId);
  return wallet.badges || [];
};

export const get_leaderboard = async () => {
  return await Wallet.find()
    .sort({ balance: -1 })
    .limit(10)
    .populate('user_id', 'email')
    .lean();
};
