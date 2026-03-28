import { query } from '../utils/db';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const getSystemMetrics = async () => {
  const urlStats = await getDatabaseStats();
  const cacheStats = await getRedisStats();
  
  return {
    ...urlStats,
    cache: cacheStats
  };
};

export const getRedisStats = async () => {
  const memoryInfo = await redis.info('memory');
  return { info: memoryInfo };
};

export const getDatabaseStats = async () => {
  const users = await query(`SELECT COUNT(*) as count FROM users`);
  const urls = await query(`SELECT COUNT(*) as count FROM urls`);
  const clicks = await query(`SELECT SUM(click_count) as total FROM urls`);
  
  return {
    usersCount: parseInt(users.rows[0]?.count || '0', 10),
    urlsCount: parseInt(urls.rows[0]?.count || '0', 10),
    totalClicks: parseInt(clicks.rows[0]?.total || '0', 10)
  };
};
