import { Queue, QueueEvents } from 'bullmq';
import { redis } from '../utils/redis';

export interface LinkCreationQueueJobData {
  longUrl: string;
  userId: number;
  shortCode: string;
  expiryDate?: string; // ISO
  provider?: string;
  scanResult?: string;
}

export const linkCreationQueue = new Queue<LinkCreationQueueJobData>('linkCreationQueue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: 200,
  },
});

export const linkCreationQueueEvents = new QueueEvents('linkCreationQueue', { connection: redis });
