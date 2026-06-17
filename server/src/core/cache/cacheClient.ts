import { Redis } from 'ioredis';
import { CACHE_KEYS } from './CacheKeys.js';

// Create a singleton instance
export const redisClient = new Redis(process.env.REDIS_URI || 'redis://127.0.0.1:6379', {
  lazyConnect: true, // Don't connect until explicitly called
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Observability Hooks
redisClient.on('connect', () => {
  console.log('✅ Redis Connected');
});

redisClient.on('error', (err) => {
  console.error(`❌ Redis Connection Error: ${err.message}`);
});

redisClient.on('close', () => {
  console.warn('⚠️ Redis Connection Closed');
});

// Graceful Shutdown helper
export const disconnectRedis = async () => {
  await redisClient.quit();
  console.log('🛑 Redis connection closed due to app termination.');
};

export class CacheService {
  /**
   * Fetch a parsed JSON object from the cache.
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Redis GET Error for key ${key}:`, error);
      return null; // Graceful degradation: act like cache miss
    }
  }

  /**
   * Store an object in the cache with a Time-To-Live (TTL) in seconds.
   */
  static async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      console.error(`Redis SET Error for key ${key}:`, error);
    }
  }

  /**
   * Delete a specific key from the cache.
   * Uses UNLINK for asynchronous, non-blocking memory reclamation.
   */
  static async delete(key: string): Promise<void> {
    try {
      await redisClient.unlink(key);
      console.info(`[Cache] Deleted key: ${key}`);
    } catch (error) {
      console.error(`[Cache] Failed to delete key ${key}:`, error);
    }
  }

  // ==========================================
  // Proactive Invalidation Methods (from your spec)
  // ==========================================

  /**
   * Invalidates the high-traffic public listings and specific org listings.
   */
  static async invalidateCoursesList(orgId?: string): Promise<void> {
    const keysToInvalidate = [CACHE_KEYS.publicCourses];

    if (orgId) {
      keysToInvalidate.push(CACHE_KEYS.orgCourses(orgId));
    }

    try {
      // Use UNLINK instead of DEL to prevent blocking the Redis event loop
      await redisClient.unlink(...keysToInvalidate);
      console.info(`[Cache] Invalidated course lists for Org: ${orgId || 'Public Only'}`);
    } catch (error) {
      console.error('[Cache] Failed to invalidate course lists:', error);
    }
  }

  /**
   * Invalidates specific course metadata.
   */
  static async invalidateCourseMeta(courseUuid: string): Promise<void> {
    try {
      await redisClient.unlink(CACHE_KEYS.courseMeta(courseUuid));
      console.info(`[Cache] Invalidated course meta: ${courseUuid}`);
    } catch (error) {
      console.error(`[Cache] Failed to invalidate course meta: ${courseUuid}`, error);
    }
  }
}