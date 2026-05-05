import { Queue, QueueEvents } from 'bullmq';
import { redis, duplicateRedis } from '../utils/redis';

export interface ScanQueueJobData {
  longUrl: string;
  userId: number | null;
  shortCode: string;
  expiryDate?: string; // ISO
}

export const scanQueue = new Queue<ScanQueueJobData>('scanQueue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 1000 },
    removeOnComplete: 100, // Keep last 100 for polling
    removeOnFail: 200,
  },
});

export const addScanJob = async (data: ScanQueueJobData) => {
  const job = await scanQueue.add('initial-scan', data);
  console.log(`[scanQueue] Job added: ${job.id} for ${data.longUrl}`);
  return job;
};

export const scanQueueEvents = new QueueEvents('scanQueue', {
  connection: duplicateRedis(),
});
