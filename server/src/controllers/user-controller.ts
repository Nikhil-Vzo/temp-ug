import { type Request,type Response } from 'express';
import * as userService from '../services/user-service.js';
import { catchAsync } from '../config/CatchAsync.js';

// ==========================================
// 1. Create User (Without Organization)
// ==========================================
export const createUserStandalone = catchAsync(async (req: any, res: Response) => {
  const { email } = req.body;
  const newUser = await userService.create_user_without_org(email);

  res.status(201).json({
    status: 'success',
    data: { user: newUser }
  });
});

// ==========================================
// 2. Create User (Inside an Organization)
// ==========================================
export const createUser = catchAsync(async (req: any, res: Response) => {
  const { email, org_id, role_name } = req.body;
  
  const newUser = await userService.create_user(email, org_id, role_name);

  res.status(201).json({
    status: 'success',
    data: { user: newUser }
  });
});

// ==========================================
// 3. Create User (From Invitation)
// ==========================================
export const createUserFromInvite = catchAsync(async (req: any, res: Response) => {
  const { email, org_id, role_id } = req.body; // Usually extracted from a verified JWT invite token
  
  const newUser = await userService.create_user_with_invite(email, org_id, role_id);

  res.status(201).json({
    status: 'success',
    data: { user: newUser }
  });
});

// ==========================================
// 4. Delete User
// ==========================================
export const deleteUser = catchAsync(async (req: any, res: Response) => {
  const id = req.params.id as string; // Expecting the MongoDB ObjectId

  await userService.delete_user_by_id(id);

  res.status(204).send(); // 204 No Content
});

// ==========================================
// 5. Get Current User Session (For Auth/Login)
// ==========================================
export const getSession = catchAsync(async (req: any, res: Response) => {
  // Grab the ID from the authenticated request (or use a hardcoded one for testing)
  const userId = (req as any).user?.id || "YOUR_REAL_USER_OBJECT_ID_HERE";

  const sessionData = await userService.get_user_session(userId);

  res.status(200).json({
    status: 'success',
    data: { session: sessionData }
  });
});

// ==========================================
// 6. Get User By ID (ObjectId)
// ==========================================
export const getUserById = catchAsync(async (req: any, res: Response) => {
  const id = req.params.id as string;
  const user = await userService.read_user_by_id(id);

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// ==========================================
// 7. Get User By UUID (Cached)
// ==========================================
export const getUserByUuid = catchAsync(async (req: any, res: Response) => {
  const uuid = req.params.uuid as string;
  const user = await userService.read_user_by_uuid(uuid);

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// ==========================================
// 8. Get User By Email
// ==========================================
export const getUserByEmail = catchAsync(async (req: any, res: Response) => {
  const email = req.params.email as string;
  const user = await userService.read_user_by_username(email);

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});