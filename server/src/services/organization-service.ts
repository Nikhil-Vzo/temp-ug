import { AppError } from "../config/CatchAsync.js";
import { runInTransaction } from "../config/database.js";
import { CacheService } from "../core/cache/cacheClient.js";
import { CACHE_KEYS } from "../core/cache/CacheKeys.js";
import { SYSTEM_ROLES } from "../core/constants/roles.js";
import Organization from "../models/Organization.js";
import OrgConfig from "../models/orgConfig-model.js";
import Role from "../models/Roles.js";
import User from "../models/User.js";


interface CreateOrgInput {
  name: string;
  slug: string;
  explore?: boolean;
}

interface UpdateOrgInput {
  name?: string;
  slug?: string;
  explore?: boolean;
}

// Helper to get the Admin Role ObjectId
const getAdminRoleId = async (session?: any) => {
  const role = await Role.findOne({ name: SYSTEM_ROLES.ADMIN }).session(session).lean();
  if (!role) throw new AppError('Critical Error: Admin role not found in database', 500);
  return role._id;
};

// ==========================================
// 1. Create Organization (Transaction Required)
// ==========================================
export const create_org = async (orgData: CreateOrgInput, userObjectId: string) => {
  return await runInTransaction(async (session) => {
    // 1. Create the Organization
    const [newOrg] = await (Organization.create as any)([orgData], { session });

    // 2. Get the Admin Role ID
    const adminRoleId = await getAdminRoleId(session);

    // 3. Update the User to grant them Admin membership to this new org
    await User.findByIdAndUpdate(
      userObjectId,
      {
        $push: {
          memberships: {
            org_id: newOrg._id,
            role_id: adminRoleId,
            joined_at: new Date()
          }
        }
      },
      { session }
    );

    return newOrg;
  });
};

// ==========================================
// 2. Create Organization with Config
// ==========================================
export const create_org_with_config = async (
  orgData: CreateOrgInput, 
  configData: any, 
  userObjectId: string
) => {
  return await runInTransaction(async (session) => {
    const [newOrg] = await (Organization.create as any)([orgData], { session });
    const adminRoleId = await getAdminRoleId(session);

    // Create associated config
    await OrgConfig.create([{ org_id: newOrg._id, ...configData }], { session });

    // Update User memberships
    await User.findByIdAndUpdate(
      userObjectId,
      {
        $push: {
          memberships: { org_id: newOrg._id, role_id: adminRoleId, joined_at: new Date() }
        }
      },
      { session }
    );

    return newOrg;
  });
};

// ==========================================
// 3. Delete Organization (Mass Cleanup)
// ==========================================
export const delete_org = async (orgUuid: string) => {
  return await runInTransaction(async (session) => {
    const org = await Organization.findOne({ organization_uuid: orgUuid }).session(session);
    if (!org) throw new AppError('Organization not found', 404);

    // 1. Delete the Organization and Config
    await Organization.deleteOne({ _id: org._id }).session(session);
    await OrgConfig.deleteOne({ org_id: org._id }).session(session);

    // 2. Scrub this org from ALL users' memberships arrays
    await User.updateMany(
      { 'memberships.org_id': org._id },
      { $pull: { memberships: { org_id: org._id } } },
      { session }
    );

    // 3. Cache Invalidation
    await CacheService.delete(CACHE_KEYS.orgMeta(orgUuid));
    if (org.slug) {
      await CacheService.delete(CACHE_KEYS.orgBySlug(org.slug));
    }

    return true;
  });
};

// ==========================================
// 4. Get Organization by UUID
// ==========================================
export const get_organization_by_uuid = async (orgUuid: string) => {
  const cacheKey = CACHE_KEYS.orgMeta(orgUuid);
  const cachedOrg = await CacheService.get(cacheKey);
  if (cachedOrg) return cachedOrg;

  const org = await Organization.findOne({ organization_uuid: orgUuid }).lean();
  if (!org) throw new AppError('Organization not found', 404);

  await CacheService.set(cacheKey, org, 3600);
  return org;
};

// ==========================================
// 5. Get Organization by Slug
// ==========================================
export const get_organization_by_slug = async (slug: string) => {
  const cacheKey = CACHE_KEYS.orgBySlug(slug);
  const cachedOrg = await CacheService.get(cacheKey);
  if (cachedOrg) return cachedOrg;

  const org = await Organization.findOne({ slug }).lean();
  if (!org) throw new AppError('Organization not found', 404);

  await CacheService.set(cacheKey, org, 3600);
  return org;
};

// ==========================================
// 6. Get Organizations by User
// ==========================================
export const get_orgs_by_user = async (userObjectId: string) => {
  // Find the user and populate the org details from the memberships array
  const user = await User.findById(userObjectId)
    .populate('memberships.org_id')
    .lean();

  if (!user) throw new AppError('User not found', 404);

  // Map over the memberships to extract just the populated Organization objects
  return user.memberships.map((m: any) => m.org_id).filter(Boolean);
};

// ==========================================
// 7. Get Organizations by User Admin
// ==========================================
export const get_orgs_by_user_admin = async (userObjectId: string) => {
  const adminRoleId = await getAdminRoleId();

  const user = await User.findById(userObjectId)
    .populate('memberships.org_id')
    .lean();

  if (!user) throw new AppError('User not found', 404);

  // Filter memberships where the role is admin, then extract the org object
  return user.memberships
    .filter((m: any) => m.role_id.toString() === adminRoleId.toString())
    .map((m: any) => m.org_id)
    .filter(Boolean);
};

// ==========================================
// 8. Update Organization
// ==========================================
export const update_org = async (orgUuid: string, updateData: UpdateOrgInput) => {
  const updatedOrg = await Organization.findOneAndUpdate(
    { organization_uuid: orgUuid },
    { $set: updateData },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedOrg) throw new AppError('Organization not found', 404);

  // Proactive Cache Invalidation
  await CacheService.delete(CACHE_KEYS.orgMeta(orgUuid));
  if (updateData.slug && updatedOrg.slug) {
    await CacheService.delete(CACHE_KEYS.orgBySlug(updatedOrg.slug));
  }

  return updatedOrg;
};

// ==========================================
// 9. Get Organization Members
// ==========================================
export const get_org_members = async (orgUuid: string) => {
  const org = await Organization.findOne({ organization_uuid: orgUuid }).lean();
  if (!org) throw new AppError('Organization not found', 404);

  const members = await User.find({ 'memberships.org_id': org._id })
    .populate({
      path: 'memberships.role_id',
      select: 'name permissions'
    })
    .lean();

  return members.map((m: any) => {
    const membership = m.memberships.find(
      (ms: any) => ms.org_id.toString() === org._id.toString()
    );
    return {
      _id: m._id,
      email: m.email,
      user_uuid: m.user_uuid,
      role: (membership?.role_id as any)?.name,
      joined_at: membership?.joined_at
    };
  });
};

// ==========================================
// 10. Update Member Role
// ==========================================
export const update_member_role = async (orgUuid: string, memberUserObjectId: string, newRoleName: string) => {
  const org = await Organization.findOne({ organization_uuid: orgUuid }).lean();
  if (!org) throw new AppError('Organization not found', 404);

  const role = await Role.findOne({ name: newRoleName as any }).lean();
  if (!role) throw new AppError(`Role ${newRoleName} not found`, 404);

  const updatedUser = await User.findOneAndUpdate(
    { _id: memberUserObjectId, 'memberships.org_id': org._id },
    { $set: { 'memberships.$.role_id': role._id } },
    { new: true }
  ).lean();

  if (!updatedUser) throw new AppError('User membership not found in this organization', 404);
  return updatedUser;
};

// ==========================================
// 11. Remove Member from Organization
// ==========================================
export const remove_member = async (orgUuid: string, memberUserObjectId: string) => {
  const org = await Organization.findOne({ organization_uuid: orgUuid }).lean();
  if (!org) throw new AppError('Organization not found', 404);

  const updatedUser = await User.findOneAndUpdate(
    { _id: memberUserObjectId },
    { $pull: { memberships: { org_id: org._id } } },
    { new: true }
  ).lean();

  if (!updatedUser) throw new AppError('User not found', 404);
  return true;
};