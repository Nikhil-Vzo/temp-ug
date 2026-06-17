// ==========================================
// 1. Create User Without Organization
// ==========================================

import { AppError } from "../config/CatchAsync.js";
import { runInTransaction } from "../config/database.js";
import { CacheService } from "../core/cache/cacheClient.js";
import User from "../models/User.js";
import Role from "../models/Roles.js";
import { SYSTEM_ROLES } from "../core/constants/roles.js";
import { CACHE_KEYS } from "../core/cache/CacheKeys.js";

// Used when a user signs up but hasn't created or joined a workspace yet
export const create_user_without_org = async (email: string) => {
  const newUser = await User.create({ email });
  return newUser;
};

// ==========================================
// 2. Create User (Standard within an Org)
// ==========================================
export const create_user = async (email: string, orgObjectId: string, roleName: string = SYSTEM_ROLES.STUDENT) => {
  return await runInTransaction(async (session) => {
    // 1. Find the exact Role ID for the requested role
    const role = await Role.findOne({ name: roleName as any }).session(session).lean();
    if (!role) throw new AppError(`Role ${roleName} not found`, 404);

    const sanitizedEmail = email.toLowerCase().trim();

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedEmail }).session(session);
    if (existingUser) {
      // Check if user is already in this organization
      const isMember = existingUser.memberships.some(
        (m: any) => m.org_id.toString() === orgObjectId.toString()
      );
      if (isMember) {
        throw new AppError('User is already a member of this organization', 400);
      }
      // Add membership
      existingUser.memberships.push({
        org_id: orgObjectId as any,
        role_id: role._id as any,
        joined_at: new Date()
      });
      await existingUser.save({ session });
      return existingUser;
    }

    // 3. Create the User with the membership pre-injected
    const [newUser] = await (User.create as any)([{
      email: sanitizedEmail,
      memberships: [{
        org_id: orgObjectId,
        role_id: role._id,
        joined_at: new Date()
      }]
    }], { session });

    return newUser;
  });
};

// ==========================================
// 3. Create User With Invite
// ==========================================
// Assuming you have an Invitation system that verifies a token first
export const create_user_with_invite = async (email: string, orgObjectId: string, roleObjectId: string) => {
  return await runInTransaction(async (session) => {
    const sanitizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedEmail }).session(session);
    if (existingUser) {
      // Check if user is already in this organization
      const isMember = existingUser.memberships.some(
        (m: any) => m.org_id.toString() === orgObjectId.toString()
      );
      if (isMember) {
        throw new AppError('User is already a member of this organization', 400);
      }
      // Add membership
      existingUser.memberships.push({
        org_id: orgObjectId as any,
        role_id: roleObjectId as any,
        joined_at: new Date()
      });
      await existingUser.save({ session });
      return existingUser;
    }

    const [newUser] = await (User.create as any)([{
      email: sanitizedEmail,
      memberships: [{
        org_id: orgObjectId,
        role_id: roleObjectId,
        joined_at: new Date()
      }]
    }], { session });

    return newUser;
  });
};

// ==========================================
// 4. Delete User By ID
// ==========================================
export const delete_user_by_id = async (userObjectId: string) => {
  return await runInTransaction(async (session) => {
    const user = await User.findById(userObjectId).session(session);
    if (!user) throw new AppError('User not found', 404);

    await User.deleteOne({ _id: userObjectId }).session(session);

    // Proactive Cache Invalidation
    if (user.user_uuid) {
      await CacheService.delete(CACHE_KEYS.userMeta(user.user_uuid.toString()));
    }

    return true;
  });
};

// ==========================================
// 5. Get User Session (The "Heavy" Payload)
// ==========================================
// Highly optimized query used during Login to generate JWTs or load the frontend
export const get_user_session = async (userObjectId: string) => {
  const user = await User.findById(userObjectId)
    .populate({
      path: 'memberships.org_id',
      select: 'organization_uuid slug name explore' // Only fetch what we need
    })
    .populate({
      path: 'memberships.role_id',
      select: 'name permissions' // Get the strict RBAC permissions
    })
    .lean();

  if (!user) throw new AppError('User not found', 404);

  return user;
};

// ==========================================
// 6. Read User By ID (Mongoose ObjectId)
// ==========================================
export const read_user_by_id = async (userObjectId: string) => {
  const user = await User.findById(userObjectId).lean();
  if (!user) throw new AppError('User not found', 404);
  return user;
};

// ==========================================
// 7. Read User By UUID (Cached)
// ==========================================
export const read_user_by_uuid = async (userUuid: string) => {
  const cacheKey = CACHE_KEYS.userMeta(userUuid);
  const cachedUser = await CacheService.get(cacheKey);
  if (cachedUser) return cachedUser;

  const user = await User.findOne({ user_uuid: userUuid }).lean();
  if (!user) throw new AppError('User not found', 404);

  await CacheService.set(cacheKey, user, 3600); // Cache for 1 hour
  return user;
};

// ==========================================
// 8. Read User By Username (Email in this schema)
// ==========================================
// Note: Since your schema uses 'email' instead of 'username', we search by email.
export const read_user_by_username = async (email: string) => {
  // Always sanitize to lowercase as defined in your schema
  const sanitizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: sanitizedEmail }).lean();
  if (!user) throw new AppError('User not found', 404);

  return user;
};