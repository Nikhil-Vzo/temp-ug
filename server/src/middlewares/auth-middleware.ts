import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../config/CatchAsync.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ugskill-secret-key-for-development-purposes-only';

export const requireAuth = async (req: any, res: Response, next: NextFunction) => {
  try {
    let token = '';
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    let userId = '';

    if (token) {
      // 1. JWT Auth Path
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        userId = decoded.id;
      } catch (err) {
        return next(new AppError('Invalid or expired authentication token', 401));
      }
    } else {
      // 2. Fallback to X-User-Id header for testing backward compatibility
      const testUserId = req.headers['x-user-id'];
      if (testUserId) {
        userId = testUserId as string;
      }
    }

    if (!userId) {
      return next(new AppError('Authentication required. Please provide a Bearer token or X-User-Id header.', 401));
    }

    // Lookup user in DB
    const user = await User.findById(userId).lean();
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // Attach user information to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      memberships: user.memberships
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict route access to specific roles within the target organization context.
 */
export const requireOrgRole = (allowedRoles: string[]) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('User not authenticated.', 401));
      }

      // Determine target organization.
      // Can be from req.params.uuid (org UUID), req.params.orgUuid, req.headers, query, or body.
      let orgUuid = req.params.uuid || req.params.orgUuid || req.headers['x-org-uuid'];
      let orgObjectId = req.query.orgId || req.body.orgId || req.headers['x-org-id'];

      let org: any = null;
      if (orgUuid) {
        org = await Organization.findOne({ organization_uuid: orgUuid }).lean();
      } else if (orgObjectId) {
        org = await Organization.findById(orgObjectId).lean();
      }

      // If we cannot find organization directly, check if we are on a course route
      if (!org && req.params.uuid && req.baseUrl.includes('courses')) {
        const Course = (await import('../models/Course.js')).default;
        const course = await Course.findOne({ course_uuid: req.params.uuid }).lean();
        if (course) {
          org = await Organization.findById(course.org_id).lean();
        }
      }

      if (!org) {
        return next(new AppError('Target organization not found or could not be determined.', 400));
      }

      // Populate user memberships
      const user = await User.findById(req.user.id).populate({
        path: 'memberships.role_id',
        select: 'name'
      }).lean();

      if (!user) {
        return next(new AppError('User not found.', 404));
      }

      // Look up membership
      const membership = user.memberships.find(
        (m: any) => m.org_id && m.org_id.toString() === org._id.toString()
      );

      const isPlatformAdmin = user.email && (
        user.email.toLowerCase() === 'admin@gmail.com' ||
        user.email.toLowerCase().startsWith('admin@') ||
        user.email.toLowerCase().includes('admin')
      );

      if (!membership && !isPlatformAdmin) {
        return next(new AppError('You are not a member of this organization.', 403));
      }

      const roleName = isPlatformAdmin ? 'admin' : (membership?.role_id as any)?.name;
      if (!allowedRoles.includes(roleName)) {
        return next(new AppError(`Access denied. Requires one of roles: ${allowedRoles.join(', ')}`, 403));
      }

      req.activeOrg = org;
      req.userOrgRole = roleName;
      next();
    } catch (err) {
      next(err);
    }
  };
};
