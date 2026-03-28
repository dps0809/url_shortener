import { Queue } from 'bullmq';
import { redis } from '../utils/redis';

export const qrQueue = new Queue('qr_generation', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
  },
});
