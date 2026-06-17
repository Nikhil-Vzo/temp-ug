import { type Request, type Response } from 'express';
import { catchAsync } from '../config/CatchAsync.js';
import * as rewardService from '../services/reward-service.js';

// ==========================================
// 1. Get Wallet
// ==========================================
export const getWallet = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id || "6a2fde02acf82e9382a4ad9b";

  const wallet = await rewardService.get_wallet(userId);

  res.status(200).json({
    status: 'success',
    data: { wallet }
  });
});

// ==========================================
// 2. Get Coin Transactions History
// ==========================================
export const getTransactions = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id || "6a2fde02acf82e9382a4ad9b";

  const transactions = await rewardService.get_transactions(userId);

  res.status(200).json({
    status: 'success',
    results: transactions.length,
    data: { transactions }
  });
});

// ==========================================
// 3. Get Earned Badges
// ==========================================
export const getBadges = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id || "6a2fde02acf82e9382a4ad9b";

  const badges = await rewardService.get_badges(userId);

  res.status(200).json({
    status: 'success',
    results: badges.length,
    data: { badges }
  });
});

// ==========================================
// 4. Get Leaderboard (Top Coin Balances)
// ==========================================
export const getLeaderboard = catchAsync(async (req: any, res: Response) => {
  const leaderboard = await rewardService.get_leaderboard();

  res.status(200).json({
    status: 'success',
    results: leaderboard.length,
    data: { leaderboard }
  });
});
