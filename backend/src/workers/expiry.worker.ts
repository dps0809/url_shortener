import { Job, Worker } from 'bullmq';
import { redis } from '../utils/redis';
import { MaintenanceQueueJobData } from '../queues/maintenance.queue';
import { checkExpiredUrls } from '../services/expiry.service';

export const expiryWorker = new Worker(
  'maintenanceQueue',
  async (job: Job<MaintenanceQueueJobData>) => {
    if (job.data?.task !== 'expiry_scan') return;

    console.log(`[expiryWorker] Starting link expiry scan (Job ID: ${job.id})`);
    await checkExpiredUrls();

    return { ok: true };
  },
  {
    connection: redis,
    concurrency: 1,
  }
);
