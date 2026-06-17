import { type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { catchAsync, AppError } from '../config/CatchAsync.js';
import User from '../models/User.js';
import Role from '../models/Roles.js';
import Organization from '../models/Organization.js';
import OrgConfig from '../models/orgConfig-model.js';
import { SYSTEM_ROLES } from '../core/constants/roles.js';
import { get_user_session } from '../services/user-service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ugskill-secret-key-for-development-purposes-only';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'mock';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Helper to sign JWT
const signToken = (id: string) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, orgName } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('Email is already registered', 400));
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await User.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    memberships: []
  });

  let newOrg = null;

  // If orgName is provided, automatically create an organization and associate as admin
  if (orgName) {
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Create org
    newOrg = await Organization.create({
      name: orgName,
      slug,
      explore: true
    });

    // Create org config
    await OrgConfig.create({
      org_id: newOrg._id,
      features: {
        enable_public_registration: false,
        enable_gamification: true,
        require_sso: false
      }
    });

    // Find admin role
    const adminRole = await Role.findOne({ name: SYSTEM_ROLES.ADMIN });
    if (adminRole) {
      user.memberships.push({
        org_id: newOrg._id as any,
        role_id: adminRole._id as any,
        joined_at: new Date()
      });
      await user.save();
    }
  }

  const token = signToken(user._id.toString());

  // Fetch populated session payload
  const session = await get_user_session(user._id.toString());

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: session
    }
  });
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.password) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // Verify password
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const token = signToken(user._id.toString());

  // Fetch populated session payload
  const session = await get_user_session(user._id.toString());

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: session
    }
  });
});

export const getMe = catchAsync(async (req: any, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.id) {
    return next(new AppError('You are not logged in.', 401));
  }

  const session = await get_user_session(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      user: session
    }
  });
});

export const googleLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { credential } = req.body;

  if (!credential || typeof credential !== 'string') {
    return next(new AppError('No Google credential token provided', 400));
  }

  const credentialStr = credential as string;
  let email = '';
  let name = '';

  // Real Google JWT verification
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credentialStr,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return next(new AppError('Google authentication failed. No email found.', 401));
    }
    email = (payload.email as string).toLowerCase();
    name = (payload.name as string) || email.split('@')[0] || 'User';
  } catch (err: any) {
    return next(new AppError(`Google verification failed: ${err.message}`, 401));
  }

  // Find or create user
  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Register new user without a password (since they use Google OAuth)
    user = await User.create({
      email: email.toLowerCase(),
      memberships: []
    });
  }

  const token = signToken(user._id.toString());
  const session = await get_user_session(user._id.toString());

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: session
    }
  });
});

export const getConfig = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    status: 'success',
    data: {
      googleClientId: GOOGLE_CLIENT_ID
    }
  });
});
