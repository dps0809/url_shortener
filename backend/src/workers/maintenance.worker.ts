import { Job, Worker } from 'bullmq';
import { duplicateRedis } from '../utils/redis';
import { MaintenanceQueueJobData } from '../queues/maintenance.queue';
import { syncClickCounters } from './analytics.worker';
import { checkLinkHealth } from '../services/linkHealth.service';
import { checkExpiredUrls } from '../services/expiry.service';

/**
 * Unified Maintenance Worker
 * Handles all periodic background tasks:
 * 1. Analytics Sync (Redis -> DB)
 * 2. Dead Link Detection (HTTP Checks)
 * 3. Link Expiry Cleanup
 */
export const createMaintenanceWorker = () => {
  console.log('--- [maintenanceWorker] Initializing and listening on "maintenanceQueue" ---');

  return new Worker(
    'maintenanceQueue',
    async (job: Job<MaintenanceQueueJobData>) => {
      const { task } = job.data;
      console.log(`[maintenanceWorker] [START] Task: ${task} (Job ID: ${job.id})`);

      try {
        switch (task) {
          case 'click_sync':
            await syncClickCounters();
            break;
          case 'dead_link_scan':
            await checkLinkHealth();
            break;
          case 'expiry_scan':
            await checkExpiredUrls();
            break;
          default:
            console.warn(`[maintenanceWorker] Unknown task received: ${task}`);
        }
        console.log(`[maintenanceWorker] [SUCCESS] Task: ${task} (Job ID: ${job.id})`);
        return { ok: true, task };
      } catch (error: any) {
        console.error(`[maintenanceWorker] [FAIL] Task ${task} (Job ${job.id}):`, error);
        throw error;
      }
    },
    {
      connection: duplicateRedis(),
      concurrency: 1, // Periodic tasks generally run sequentially to avoid DB lock contention
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 100 }
    }
  );
};

// Singleton pattern for HMR stability
const globalForMaintenance = global as unknown as { maintenanceWorker: Worker };
export const maintenanceWorker = globalForMaintenance.maintenanceWorker || createMaintenanceWorker();

if (process.env.NODE_ENV !== 'production') {
  globalForMaintenance.maintenanceWorker = maintenanceWorker;
}
