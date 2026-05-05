import { Worker, Job } from 'bullmq';
import { duplicateRedis } from '../utils/redis';
import { QRQueueJobData } from '../queues/qr.queue';
import { getUrlById } from '../models/url.model';
import { generateQRCode } from '../services/qr.service';

/**
 * Robust QR Worker
 * Generates QR codes for shortened URLs and stores the result.
 */
export const createQrWorker = () => {
  console.log('--- [qrWorker] Initializing and listening on "qrQueue" ---');

  const worker = new Worker(
    'qrQueue',
    async (job: Job<QRQueueJobData>) => {
      const { urlId } = job.data;
      console.log(`[qrWorker] [START] Job ${job.id} - urlId: ${urlId}`);

      try {
        const url = await getUrlById(urlId);
        if (!url) {
          throw new Error(`URL record not found for urlId: ${urlId}`);
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const shortUrl = `${baseUrl}/${url.short_code}`;

        // QR generation is simulated for now, but we add a 10s logic timeout just in case
        const qrUrl = await Promise.race([
          generateQRCode(urlId, shortUrl),
          new Promise((_, reject) => setTimeout(() => reject(new Error('QR Generation Timeout')), 10000))
        ]) as string;

        console.log(`[qrWorker] [SUCCESS] Job ${job.id} - QR URL: ${qrUrl}`);
        return { ok: true, qrUrl };
      } catch (error: any) {
        console.error(`[qrWorker] [FAIL] Job ${job.id}:`, error);
        throw error;
      }
    },
    {
      connection: duplicateRedis(),
      concurrency: 5,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 1000 }
    }
  );

  worker.on('error', (err) => console.error('[qrWorker] Global Error:', err));

  return worker;
};

// Singleton pattern for HMR stability in dev
const globalForQR = global as unknown as { qrWorker: Worker };
export const qrWorker = globalForQR.qrWorker || createQrWorker();

if (process.env.NODE_ENV !== 'production') {
  globalForQR.qrWorker = qrWorker;
}
