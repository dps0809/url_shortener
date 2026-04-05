import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const checkRedirectLimit = async (ipAddress: string): Promise<boolean> => {
  const key = `ratelimit:redirect:${ipAddress}`;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, 60); // 1 minute window
  }
  return current <= 20; // 20 redirects/min
};

export const checkCreationLimit = async (userId: number): Promise<boolean> => {
  const key = `ratelimit:create:${userId}`;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, 86400); // 1 day window
  }
  return current <= 50; // 50 links/day
};

export const getRemainingQuota = async (userId: number): Promise<number> => {
  const key = `ratelimit:create:${userId}`;
  const current = await redis.get(key);
  const used = current ? parseInt(current, 10) : 0;
  return Math.max(0, 50 - used);
};

export const getRemainingRedirectQuota = async (ipAddress: string): Promise<number> => {
  const key = `ratelimit:redirect:${ipAddress}`;
  const current = await redis.get(key);
  const used = current ? parseInt(current, 10) : 0;
  return Math.max(0, 20 - used);
};
