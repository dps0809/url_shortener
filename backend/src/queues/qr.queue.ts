import { Queue } from 'bullmq';
import { redis } from '../utils/redis';

export interface QRQueueJobData {
  urlId: number;
  shortCode: string;
}

export const qrQueue = new Queue<QRQueueJobData>('qrQueue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: 200,
  },
});
