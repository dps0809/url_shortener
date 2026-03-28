import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const linkCreationQueue = new Queue('linkCreation', { connection });
export const scanJobQueue = new Queue('scanJob', { connection });
export const qrGenerationQueue = new Queue('qrGeneration', { connection });
export const analyticsSyncQueue = new Queue('analyticsSync', { connection });

export const enqueueLinkCreation = async (urlId: number, shortCode: string, longUrl: string) => {
  await linkCreationQueue.add('create', { urlId, shortCode, longUrl });
};

export const enqueueScanJob = async (urlId: number, longUrl: string, userId: number) => {
  await scanJobQueue.add('scan', { urlId, longUrl, userId });
};

export const enqueueQRGeneration = async (urlId: number, longUrl: string) => {
  await qrGenerationQueue.add('generate', { urlId, longUrl });
};

export const enqueueAnalyticsSync = async (data: { shortCode: string, ipAddress: string, userAgent: string, timestamp: Date }) => {
  await analyticsSyncQueue.add('sync', data);
};
