import { Queue, QueueEvents } from 'bullmq';
import { redis } from '../utils/redis';

export interface ScanQueueJobData {
  longUrl: string;
  userId: number;
  customAlias?: string;
  expiryDate?: string; // ISO
}

export const scanQueue = new Queue<ScanQueueJobData>('scanQueue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 200,
  },
});

export const scanQueueEvents = new QueueEvents('scanQueue', { connection: redis });
