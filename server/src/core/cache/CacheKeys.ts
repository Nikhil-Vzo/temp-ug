/**
 * Centralized dictionary for Redis Cache Keys.
 * Use functions for keys that require dynamic parameters.
 */
export const CACHE_KEYS = {
  // Course Listings
  publicCourses: 'courses_list:public',
  orgCourses: (orgId: string) => `courses_list:org:${orgId}`,

  // Single Entity Metadata
  courseMeta: (courseUuid: string) => `course_meta:${courseUuid}`,
  chapterMeta: (chapterUuid: string) => `chapter_meta:${chapterUuid}`,

  // Advanced: Wildcard pattern for clearing all courses in an org
  orgCoursesPattern: (orgId: string) => `courses_list:org:${orgId}*`,
  orgMeta: (orgUuid: string) => `org:meta:${orgUuid}`,
  orgBySlug: (slug: string) => `org:slug:${slug}`,
  userMeta: (userUuid: string) => `user:meta:${userUuid}`,
};