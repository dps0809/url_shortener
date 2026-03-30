import { Job, Worker } from 'bullmq';
import { redis } from '../utils/redis';
import pool from '../utils/db';
import { LoggingQueueJobData } from '../queues/logging.queue';

export const loggingWorker = new Worker(
  'loggingQueue',
  async (job: Job<LoggingQueueJobData>) => {
    const { action, userId, urlId, shortCode, longUrl, provider, scanResult } = job.data;

    const details = {
      urlId,
      shortCode,
      longUrl,
      provider,
      scanResult,
    };

    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, target_url_id)
       VALUES ($1, $2, $3)`,
      [userId, `${action}:${JSON.stringify(details)}`, urlId ?? null]
    );

    return { ok: true };
  },
  {
    connection: redis,
    concurrency: 10,
  }
);
