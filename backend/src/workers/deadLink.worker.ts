import { Job, Worker } from 'bullmq';
import { redis } from '../utils/redis';
import { MaintenanceQueueJobData } from '../queues/maintenance.queue';
import { checkLinkHealth } from '../services/linkHealth.service';

export const deadLinkWorker = new Worker(
  'maintenanceQueue',
  async (job: Job<MaintenanceQueueJobData>) => {
    if (job.data?.task !== 'dead_link_scan') return;

    console.log(`[deadLinkWorker] Starting dead link scan (Job ID: ${job.id})`);
    await checkLinkHealth();
    
    return { ok: true };
  },
  {
    connection: redis,
    concurrency: 1,
  }
);
