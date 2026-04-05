import { Queue, QueueEvents } from 'bullmq';
import { redis } from '../utils/redis';

export interface MaintenanceQueueJobData {
  task: 'dead_link_scan' | 'expiry_scan' | 'click_sync' | 'malware_scan';
  urlId?: number;
  originalUrl?: string;
}

export const maintenanceQueue = new Queue<MaintenanceQueueJobData>('maintenanceQueue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: 200,
  },
});

export const maintenanceQueueEvents = new QueueEvents('maintenanceQueue', { connection: redis.duplicate() });
