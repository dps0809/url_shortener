import { Queue } from 'bullmq';
import { redis } from '../utils/redis';

export const scanQueue = new Queue('malware_scan', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
    removeOnComplete: true,
  },
});
