import { Job, Worker } from 'bullmq';
import { duplicateRedis } from '../utils/redis';
import { createUrl, UrlRecord } from '../models/url.model';
import { LinkCreationQueueJobData } from '../queues/linkCreation.queue';

/**
 * Robust Link Creation Worker
 * Handles the persistent storage of shortened URLs in the Database.
 * Fanning out of auxiliary tasks (QR, Logging) is now handled by the Service Layer
 * to optimize main-thread latency.
 */
export const createLinkCreationWorker = () => {
  console.log('--- [linkCreationWorker] Initializing and listening on "linkCreationQueue" ---');

  return new Worker(
    'linkCreationQueue',
    async (job: Job<LinkCreationQueueJobData>): Promise<UrlRecord> => {
      const { longUrl, userId, shortCode, expiryDate } = job.data;
      console.log(`[linkCreationWorker] [START] Job ${job.id} - shortCode: ${shortCode}`);
      
      try {
        const expiry = expiryDate ? new Date(expiryDate) : null;

        // 1. Store in Database
        const urlRecord = await createUrl(shortCode, longUrl, userId, expiry);
        if (!urlRecord) {
          throw new Error(`Failed to commit URL record for shortCode: ${shortCode}`);
        }

        console.log(`[linkCreationWorker] [SUCCESS] Job ${job.id} - urlId: ${urlRecord.url_id || urlRecord.id}`);
        return urlRecord;
      } catch (error: any) {
        console.error(`[linkCreationWorker] [FAIL] Job ${job.id}:`, error);
        throw error;
      }
    },
    {
      connection: duplicateRedis(),
      concurrency: 10,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 1000 }
    }
  );
};

// Singleton pattern for HMR stability
const globalForCreation = global as unknown as { linkCreationWorker: Worker };
export const linkCreationWorker = globalForCreation.linkCreationWorker || createLinkCreationWorker();

if (process.env.NODE_ENV !== 'production') {
  globalForCreation.linkCreationWorker = linkCreationWorker;
}
