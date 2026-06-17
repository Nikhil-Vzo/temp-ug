import {type Request,type Response } from 'express';
import { catchAsync } from '../config/CatchAsync.js';
import * as orgService from '../services/organization-service.js';

// ==========================================
// 1. Create Organization (with Config)
// ==========================================
export const createOrganization = catchAsync(async (req: any, res: Response) => {
  // ⚠️ CRITICAL FOR TESTING: This MUST be a real User ObjectId that exists in your database.
  // Mongoose needs a real user document to attach the new membership array to!
  const userId = req.user?.id || "6a2fde02acf82e9382a4ad9b";

  // We extract the optional 'config' object from the body, and keep the rest as org data
  const { config, ...orgData } = req.body;

  // We default to create_org_with_config to ensure the OrgConfig vault is always initialized
  const newOrg = await orgService.create_org_with_config(
    orgData, 
    config || {}, // Pass empty config if none provided in the request
    userId
  );

  res.status(201).json({
    status: 'success',
    data: { organization: newOrg }
  });
});

// ==========================================
// 2. Get Organization by UUID
// ==========================================
export const getOrganizationByUuid = catchAsync(async (req: any, res: Response) => {
  const { uuid } = req.params;
  const org = await orgService.get_organization_by_uuid(uuid);

  res.status(200).json({
    status: 'success',
    data: { organization: org }
  });
});

// ==========================================
// 3. Get Organization by Slug
// ==========================================
export const getOrganizationBySlug = catchAsync(async (req: any, res: Response) => {
  const { slug } = req.params;
  const org = await orgService.get_organization_by_slug(slug);

  res.status(200).json({
    status: 'success',
    data: { organization: org }
  });
});

// ==========================================
// 4. Get Organizations for Current User
// ==========================================
// Endpoint: GET /api/organizations/my-orgs?adminOnly=true
export const getUserOrganizations = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id || "YOUR_REAL_USER_OBJECT_ID_HERE";
  
  // Check if the client only wants organizations where this user is an ADMIN
  const { adminOnly } = req.query;

  const orgs = adminOnly === 'true' 
    ? await orgService.get_orgs_by_user_admin(userId)
    : await orgService.get_orgs_by_user(userId);

  res.status(200).json({
    status: 'success',
    results: orgs.length,
    data: { organizations: orgs }
  });
});

// ==========================================
// 5. Update Organization
// ==========================================
export const updateOrganization = catchAsync(async (req: any, res: Response) => {
  const { uuid } = req.params;
  
  const updatedOrg = await orgService.update_org(uuid, req.body);

  res.status(200).json({
    status: 'success',
    data: { organization: updatedOrg }
  });
});

// ==========================================
// 6. Delete Organization
// ==========================================
export const deleteOrganization = catchAsync(async (req: any, res: Response) => {
  const { uuid } = req.params;

  await orgService.delete_org(uuid);

  res.status(204).send(); // 204 No Content
});

// ==========================================
// 7. Get Organization Members
// ==========================================
export const getOrganizationMembers = catchAsync(async (req: any, res: Response) => {
  const { uuid } = req.params;
  const members = await orgService.get_org_members(uuid);

  res.status(200).json({
    status: 'success',
    results: members.length,
    data: { members }
  });
});

// ==========================================
// 8. Update Member Role
// ==========================================
export const updateMemberRole = catchAsync(async (req: any, res: Response) => {
  const { uuid, userId } = req.params;
  const { roleName } = req.body;

  const updatedUser = await orgService.update_member_role(uuid, userId, roleName);

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser }
  });
});

// ==========================================
// 9. Remove Member
// ==========================================
export const removeMember = catchAsync(async (req: any, res: Response) => {
  const { uuid, userId } = req.params;
  await orgService.remove_member(uuid, userId);

  res.status(204).send(); // 204 No Content
});