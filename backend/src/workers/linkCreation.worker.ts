import { Job, Worker } from 'bullmq';
import { redis } from '../utils/redis';
import { createUrl, UrlRecord } from '../models/url.model';
import { LinkCreationQueueJobData } from '../queues/linkCreation.queue';
import { qrQueue } from '../queues/qr.queue';
import { analyticsQueue } from '../queues/analytics.queue';
import { loggingQueue } from '../services/queue.service';

export const linkCreationWorker = new Worker(
  'linkCreationQueue',
  async (job: Job<LinkCreationQueueJobData>): Promise<UrlRecord> => {
    const { longUrl, userId, shortCode, expiryDate, provider, scanResult } = job.data;
    const expiry = expiryDate ? new Date(expiryDate) : null;

    // 1. Store in Database
    const urlRecord = await createUrl(shortCode, longUrl, userId, expiry);
    if (!urlRecord) throw new Error('Failed to create URL record in DB');

    // 2. Fan-out Asynchronous Tasks
    // Generate QR
    await qrQueue.add('generate', { urlId: urlRecord.id, shortCode: urlRecord.short_code });
    
    // Setup Analytics
    await analyticsQueue.add('setup', { urlId: urlRecord.id, shortCode: urlRecord.short_code });
    
    // Log Creation
    await loggingQueue.add('log', {
      action: 'URL_CREATED',
      userId,
      urlId: urlRecord.id,
      shortCode: urlRecord.short_code,
      longUrl: urlRecord.long_url,
      provider,
      scanResult,
    });

    return urlRecord;
  },
  {
    connection: redis,
    concurrency: 10,
  }
);
