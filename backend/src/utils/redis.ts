import Redis from 'ioredis';
import { env } from '../config/env';

class RedisClient {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      RedisClient.instance.on('error', (err) => {
        console.error('Redis Client Critical Error:', err);
      });
      RedisClient.instance.on('connect', () => {
        console.log('Redis Client: Connection established.');
      });
      RedisClient.instance.on('ready', () => {
        console.log('Redis Client: Ready to serve requests.');
      });

      // Verification ping
      RedisClient.instance.ping()
        .then(() => console.log('Redis Connectivity Check: OK'))
        .catch(err => console.error('Redis Connectivity Check: FAILED', err));
    }
    return RedisClient.instance;
  }
}

export const redis = RedisClient.getInstance();
export const getRedisInstance = () => RedisClient.getInstance();

/**
 * Creates a duplicate Redis connection specialized for BullMQ components.
 * BullMQ requires maxRetriesPerRequest to be null for QueueEvents and Workers.
 */
export function duplicateRedis(): Redis {
  const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  console.log(`[Redis] Creating duplicate connection specialized for BullMQ: ${url}`);
  return new Redis(url, {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    },
  });
}

export async function getCache(key: string): Promise<string | null> {
  try {
    return await redis.get(key);
  } catch (err) {
    console.error(`Redis Get Error for key ${key}:`, err);
    return null; // Fallback gracefully
  }
}

export async function setCache(key: string, value: string, ttlSeconds?: number): Promise<void> {
  try {
    if (ttlSeconds) {
      await redis.set(key, value, 'EX', ttlSeconds);
    } else {
      await redis.set(key, value);
    }
  } catch (err) {
    console.error(`Redis Set Error for key ${key}:`, err);
  }
}

export async function delCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`Redis Del Error for key ${key}:`, err);
  }
}

export async function incrCounter(key: string): Promise<number | null> {
  try {
    return await redis.incr(key);
  } catch (err) {
    console.error(`Redis Incr Error for key ${key}:`, err);
    return null;
  }
}

export async function expireKey(key: string, seconds: number): Promise<void> {
  try {
    await redis.expire(key, seconds);
  } catch (err) {
    console.error(`Redis Expire Error for key ${key}:`, err);
  }
}
