import { Router } from 'express';
import * as rewardController from '../controllers/reward-controller.js';

const router = Router();

// GET /api/v1/rewards/wallet
router.get('/rewards/wallet', rewardController.getWallet);

// GET /api/v1/rewards/transactions
router.get('/rewards/transactions', rewardController.getTransactions);

// GET /api/v1/rewards/badges
router.get('/rewards/badges', rewardController.getBadges);

// GET /api/v1/rewards/leaderboard
router.get('/rewards/leaderboard', rewardController.getLeaderboard);

export default router;
