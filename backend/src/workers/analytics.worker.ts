import { Job, Worker } from 'bullmq';
import { duplicateRedis } from '../utils/redis';
import pool, { query } from '../utils/db';
import { AnalyticsJobData, AnalyticsClickJobData, AnalyticsSetupJobData } from '../queues/analytics.queue';
import { MaintenanceQueueJobData } from '../queues/maintenance.queue';
import { getUrlByShortCode } from '../models/url.model';
import { insertClickLog } from '../models/click.model';
import { initUrlStats } from '../utils/queries/stats';
import { UAParser } from 'ua-parser-js';
import { getRedisInstance } from '../utils/redis';

/**
 * Logic helper for batch click synchronization
 * Moves counter data from Redis to Postgres in chunks
 */
export const syncClickCounters = async () => {
  const redis = getRedisInstance();
  try {
    const keys = await redis.keys('clicks:*');
    console.log(`[syncClickCounters] Found ${keys.length} click keys to sync`);
    
    for (const key of keys) {
      const code = key.replace('clicks:', '');
      const clicksStr = await redis.get(key);
      const clicks = parseInt(clicksStr || '0', 10);
      
      if (clicks > 0) {
        await query('UPDATE urls SET click_count = click_count + $1 WHERE short_code = $2', [clicks, code]);
        await redis.decrby(key, clicks);
      }
    }
  } catch (error) {
    console.error('[syncClickCounters] FAILED:', error);
  }
};

/**
 * 1. Worker for individual analytics setup and click logging
 */
export const createAnalyticsWorker = () => {
  console.log('--- [analyticsWorker] Initializing and listening on "analyticsQueue" ---');
  
  return new Worker(
    'analyticsQueue',
    async (job: Job<AnalyticsJobData>) => {
      console.log(`[analyticsWorker] [START] Job ${job.id} - Type: ${job.name || 'default'}`);
      const data = job.data;

      try {
        // Handle Setup (initialize stats)
        if (job.name === 'setup' || ('urlId' in data && !('ipAddress' in data))) {
          const client = await pool.connect();
          try {
            await initUrlStats(client, (data as AnalyticsSetupJobData).urlId);
          } finally {
            client.release();
          }
        } else {
          // Handle Individual Click logging
          const click = data as AnalyticsClickJobData;
          const url = await getUrlByShortCode(click.shortCode);
          if (url) {
            const parser = new UAParser(click.userAgent);
            const uaResult = parser.getResult();
            const device = uaResult.device.type || 'desktop';
            await insertClickLog(url.id, null, device, click.ipAddress);
          }
        }
        console.log(`[analyticsWorker] [SUCCESS] Job ${job.id}`);
      } catch (error) {
        console.error(`[analyticsWorker] [FAIL] Job ${job.id}:`, error);
        throw error;
      }
    },
    {
      connection: duplicateRedis(),
      concurrency: 10,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 1000 }
    }
  );
};

/**
 * 2. Worker for periodic maintenance tasks (Click Sync, etc.)
 */
export const createMaintenanceWorker = () => {
  console.log('--- [maintenanceWorker] Initializing and listening on "maintenanceQueue" ---');
  
  return new Worker(
    'maintenanceQueue',
    async (job: Job<MaintenanceQueueJobData>) => {
      const { task } = job.data;
      console.log(`[maintenanceWorker] [START] Task: ${task} (Job: ${job.id})`);

      try {
        switch (task) {
          case 'click_sync':
            await syncClickCounters();
            break;
          // Other maintenance tasks (dead_link_scan, expiry_scan) are handled by their own workers or here
          default:
            console.log(`[maintenanceWorker] Unknown task: ${task}`);
        }
        console.log(`[maintenanceWorker] [SUCCESS] Task: ${task}`);
      } catch (error) {
        console.error(`[maintenanceWorker] [FAIL] Job ${job.id}:`, error);
        throw error;
      }
    },
    {
      connection: duplicateRedis(),
      concurrency: 1,
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 100 }
    }
  );
};

// Singleton pattern for HMR stability
const globalForAnalytics = global as unknown as { 
  analyticsWorker: Worker; 
};

export const analyticsWorker = globalForAnalytics.analyticsWorker || createAnalyticsWorker();

if (process.env.NODE_ENV !== 'production') {
  globalForAnalytics.analyticsWorker = analyticsWorker;
}
