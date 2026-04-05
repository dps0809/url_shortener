/**
 * Redis Configuration
 * 
 * Redis Stack is running on localhost:6379.
 * Used by: BullMQ queues/workers, caching, rate limiting, click counters.
 * 
 * The main Redis client singleton is in utils/redis.ts.
 * This file exports configuration constants used across the codebase.
 */

export const REDIS_CONFIG = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  maxRetriesPerRequest: null as null,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Key Prefixes
export const REDIS_KEYS = {
  /** Cached redirect URL: short:{shortCode} → longUrl */
  SHORT_URL: 'short:',
  /** Click counter: clicks:{shortCode} → count */
  CLICK_COUNTER: 'clicks:',
  /** Rate limit for redirects: ratelimit:redirect:{ip} → count */
  RATE_LIMIT_REDIRECT: 'ratelimit:redirect:',
  /** Rate limit for creation: ratelimit:create:{userId} → count */
  RATE_LIMIT_CREATE: 'ratelimit:create:',
  /** Worker lock: lock:worker:{jobId} → 'locked' */
  WORKER_LOCK: 'lock:worker:',
  /** Rate limit (middleware): rate:{type}:user:{userId} → count */
  RATE_MIDDLEWARE: 'rate:',
};

// TTL Constants (seconds)
export const REDIS_TTL = {
  URL_CACHE: 3600,      // 1 hour default cache
  REDIRECT_WINDOW: 60,  // 1 minute rate limit window
  CREATE_WINDOW: 86400,  // 24 hour rate limit window
  WORKER_LOCK: 60,      // 1 minute worker lock
};
