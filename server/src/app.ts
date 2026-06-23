import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth-router.js';
import { requireAuth } from './middlewares/auth-middleware.js';

import organizationsRouter from './routes/organization-router.js';
import usersRouter from './routes/user-router.js';
import coursesRouter from './routes/course-router.js';
import chaptersRouter from './routes/chapter-router.js';
import sectionRouter from './routes/section-router.js';
import moduleRouter from './routes/module-router.js';
import lessonRouter from './routes/lesson-router.js';
import mediaRouter from './routes/media-router.js';
import enrollmentRouter from './routes/enrollment-router.js';
import progressRouter from './routes/progress-router.js';
import quizRouter from './routes/quiz-router.js';
import assignmentRouter from './routes/assignment-router.js';
import certificateRouter from './routes/certificate-router.js';
import rewardRouter from './routes/reward-router.js';
import notificationRouter from './routes/notification-router.js';
import analyticsRouter from './routes/analytics-router.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mock Auth Middleware for testing (populates req.user.id from X-User-Id header)
app.use((req: any, res: any, next: any) => {
  const testUserId = req.headers['x-user-id'];
  if (testUserId) {
    req.user = { id: testUserId };
  }
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', authRouter);

app.use('/api/organizations', requireAuth, organizationsRouter);
app.use('/api/users', requireAuth, usersRouter);
app.use('/api/courses', requireAuth, coursesRouter);
app.use('/api/chapters', requireAuth, chaptersRouter);

app.use('/api/v1/courses', requireAuth, coursesRouter);
app.use('/api/v1', requireAuth, sectionRouter);
app.use('/api/v1', requireAuth, moduleRouter);
app.use('/api/v1', requireAuth, lessonRouter);
app.use('/api/v1', requireAuth, mediaRouter);
app.use('/api/v1', requireAuth, enrollmentRouter);
app.use('/api/v1', requireAuth, progressRouter);
app.use('/api/v1', requireAuth, quizRouter);
app.use('/api/v1', requireAuth, assignmentRouter);
app.use('/api/v1', requireAuth, certificateRouter);
app.use('/api/v1', requireAuth, rewardRouter);
app.use('/api/v1', requireAuth, notificationRouter);
app.use('/api/v1', requireAuth, analyticsRouter);

app.use((err: any, req: any, res: any, next: any) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  res.status(statusCode).json({ status, message: err.message });
});

export default app;