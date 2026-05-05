import { Queue, QueueEvents } from 'bullmq';
import { redis, duplicateRedis } from '../utils/redis';

export interface LinkCreationQueueJobData {
  longUrl: string;
  userId: number | null;
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
    removeOnComplete: 100, // Keep last 100 for polling
    removeOnFail: 200,
  },
});

export const addLinkCreationJob = async (data: LinkCreationQueueJobData) => {
  const job = await linkCreationQueue.add('create-link', data);
  console.log(`[linkCreationQueue] Job added: ${job.id} for ${data.shortCode}`);
  return job;
};

export const linkCreationQueueEvents = new QueueEvents('linkCreationQueue', {
  connection: duplicateRedis(),
});
