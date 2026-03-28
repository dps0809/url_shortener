import { getCache, setCache, delCache, incrCounter, expireKey, redis } from '../utils/redis';

export const getCachedUrl = async (shortCode: string): Promise<string | null> => {
  return await getCache(`short:${shortCode}`);
};

export const cacheUrl = async (shortCode: string, longUrl: string, ttlSeconds: number = 86400): Promise<void> => {
  await setCache(`short:${shortCode}`, longUrl, ttlSeconds);
};

export const deleteCachedUrl = async (shortCode: string): Promise<void> => {
  await delCache(`short:${shortCode}`);
};

export const incrClickCounter = async (shortCode: string): Promise<number | null> => {
  return await incrCounter(`clicks:${shortCode}`);
};

export const getClickCounter = async (shortCode: string): Promise<number> => {
  const result = await getCache(`clicks:${shortCode}`);
  return result ? parseInt(result, 10) : 0;
};

export const resetClickCounter = async (shortCode: string): Promise<void> => {
  await setCache(`clicks:${shortCode}`, '0');
};

export const enforceRedirectRateLimit = async (userId: number, limit: number = 20, windowSeconds: number = 60): Promise<boolean> => {
  const key = `rate:redirect:user:${userId}`;
  const current = await incrCounter(key);
  if (current === 1) {
    await expireKey(key, windowSeconds);
  }
  return current !== null && current <= limit;
};

export const enforceCreateUrlRateLimit = async (userId: number, limit: number = 50, windowSeconds: number = 86400): Promise<boolean> => {
  const key = `rate:create:user:${userId}`;
  const current = await incrCounter(key);
  if (current === 1) {
    await expireKey(key, windowSeconds);
  }
  return current !== null && current <= limit;
};

export const getRedirectRateLimitCount = async (userId: number): Promise<number> => {
  const key = `rate:redirect:user:${userId}`;
  const result = await getCache(key);
  return result ? parseInt(result, 10) : 0;
};

export const acquireWorkerLock = async (jobId: string, ttlSeconds: number = 60): Promise<boolean> => {
  const key = `lock:worker:${jobId}`;
  const result = await redis.set(key, 'locked', 'EX', ttlSeconds, 'NX');
  return result === 'OK';
};
