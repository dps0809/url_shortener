import { Queue } from 'bullmq';
import { redis } from '../utils/redis';

export interface LoggingQueueJobData {
  action: 'URL_CREATED' | 'URL_MALICIOUS_BLOCKED';
  userId: number;
  urlId?: number;
  shortCode?: string;
  longUrl?: string;
  provider?: string;
  scanResult?: string;
}

export const loggingQueue = new Queue<LoggingQueueJobData>('loggingQueue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: 500,
  },
});
