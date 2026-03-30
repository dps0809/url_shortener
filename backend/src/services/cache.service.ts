import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const getUrlCache = async (shortCode: string): Promise<string | null> => {
  return await redis.get(`short:${shortCode}`);
};

export const setUrlCache = async (shortCode: string, longUrl: string, ttlSeconds: number = 3600): Promise<void> => {
  await redis.set(`short:${shortCode}`, longUrl, 'EX', ttlSeconds);
};

export const deleteUrlCache = async (shortCode: string): Promise<void> => {
  await redis.del(`short:${shortCode}`);
};
