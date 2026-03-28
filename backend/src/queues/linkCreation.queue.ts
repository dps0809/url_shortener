import { Queue } from 'bullmq';
import { redis } from '../utils/redis';

export const linkCreationQueue = new Queue('link_creation', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 100, // keep last 100 failed jobs
  },
});
