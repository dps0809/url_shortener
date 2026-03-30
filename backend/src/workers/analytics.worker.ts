import { Job, Worker } from 'bullmq';
import { redis } from '../utils/redis';
import pool from '../utils/db';
import { AnalyticsJobData, AnalyticsClickJobData, AnalyticsSetupJobData } from '../queues/analytics.queue';
import { MaintenanceQueueJobData } from '../queues/maintenance.queue';
import { getUrlByShortCode } from '../models/url.model';
import { insertClickLog } from '../models/click.model';
import { initUrlStats } from '../utils/queries/stats';
import { syncClickCounters } from '../services/worker.service';

// 1. Worker for individual analytics setup and click logging (analyticsQueue)
export const analyticsWorker = new Worker(
  'analyticsQueue',
  async (job: Job<AnalyticsJobData>) => {
    const data = job.data;

    // Handle Setup (initialize stats)
    if (job.name === 'setup' || ('urlId' in data && !('ipAddress' in data))) {
      const client = await pool.connect();
      try {
        await initUrlStats(client, (data as AnalyticsSetupJobData).urlId);
      } finally {
        client.release();
      }
      return { ok: true };
    }

    // Handle Individual Click
    const click = data as AnalyticsClickJobData;
    const url = await getUrlByShortCode(click.shortCode);
    if (!url) return { ok: true, ignored: true };

    const device = click.userAgent ? (click.userAgent.includes('Mobile') ? 'mobile' : 'desktop') : null;
    await insertClickLog(url.id, null, device, click.ipAddress);

    return { ok: true };
  },
  {
    connection: redis,
    concurrency: 10,
  }
);

// 2. Worker for periodic Click Synchronization (maintenanceQueue)
export const clickSyncWorker = new Worker(
  'maintenanceQueue',
  async (job: Job<MaintenanceQueueJobData>) => {
    if (job.data?.task !== 'click_sync') return;

    console.log(`[clickSyncWorker] Starting batch click synchronization (Job ID: ${job.id})`);
    await syncClickCounters();
    
    return { ok: true };
  },
  {
    connection: redis,
    concurrency: 1,
  }
);
