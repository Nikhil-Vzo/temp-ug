// ==========================================
// System Roles
// ==========================================
export const SYSTEM_ROLES = {
  ADMIN: 'admin',
  MAINTAINER: 'maintainer',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student'
} as const;

// Extract strict TypeScript types from the constant
export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

// ==========================================
// Role Groupings for Middleware Guards
// ==========================================
// Used in your requireRole() middleware to quickly check high-level access
export const ADMIN_OR_MAINTAINER_ROLE_IDS = [
  SYSTEM_ROLES.ADMIN,
  SYSTEM_ROLES.MAINTAINER
];

export const CONTENT_CREATOR_ROLE_IDS = [
  SYSTEM_ROLES.ADMIN,
  SYSTEM_ROLES.MAINTAINER,
  SYSTEM_ROLES.INSTRUCTOR
];

// ==========================================
// Contributor / Invitation Statuses
// ==========================================
// Used when inviting a user to collaborate on a Course
export const CONTRIBUTOR_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
} as const;

export type ContributorStatus = typeof CONTRIBUTOR_STATUS[keyof typeof CONTRIBUTOR_STATUS];