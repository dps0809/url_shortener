import { Job, Worker } from 'bullmq';
import { duplicateRedis } from '../utils/redis';
import pool from '../utils/db';
import { LoggingQueueJobData } from '../queues/logging.queue';

/**
 * Robust Logging Worker
 * Records audit logs for critical system events.
 */
export const createLoggingWorker = () => {
  console.log('--- [loggingWorker] Initializing and listening on "loggingQueue" ---');

  return new Worker(
    'loggingQueue',
    async (job: Job<LoggingQueueJobData>) => {
      const { action, userId, urlId, shortCode, longUrl, provider, scanResult } = job.data;
      console.log(`[loggingWorker] [START] Job ${job.id} - Action: ${action}`);

      try {
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
          [userId, `${action}: ${JSON.stringify(details)}`, urlId ?? null]
        );

        console.log(`[loggingWorker] [SUCCESS] Job ${job.id} - Action recorded`);
        return { ok: true };
      } catch (error: any) {
        console.error(`[loggingWorker] [FAIL] Job ${job.id}:`, error);
        throw error;
      }
    },
    {
      connection: duplicateRedis(),
      concurrency: 10,
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 1000 }
    }
  );
};

// Singleton pattern for HMR stability
const globalForLogging = global as unknown as { loggingWorker: Worker };
export const loggingWorker = globalForLogging.loggingWorker || createLoggingWorker();

if (process.env.NODE_ENV !== 'production') {
  globalForLogging.loggingWorker = loggingWorker;
}
