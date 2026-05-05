import { Queue } from 'bullmq';
import { redis } from '../utils/redis';

export interface AnalyticsSetupJobData {
  urlId: number;
  shortCode: string;
}

export interface AnalyticsClickJobData {
  shortCode: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export type AnalyticsJobData = AnalyticsSetupJobData | AnalyticsClickJobData;

export const analyticsQueue = new Queue<AnalyticsJobData>('analyticsQueue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 500,
  },
});

export const addAnalyticsJob = async (name: string, data: AnalyticsJobData) => {
  const job = await analyticsQueue.add(name, data);
  console.log(`[analyticsQueue] Job added: ${job.id} (name: ${name})`);
  return job;
};
