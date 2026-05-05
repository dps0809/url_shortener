import { Worker, Job, UnrecoverableError } from 'bullmq';
import { scanUrl } from '../utils/safety';
import { duplicateRedis } from '../utils/redis';
import { finalizeUrlCreation } from '../services/url.service';

/**
 * Robust Scan Worker (Pipeline Driver)
 * Processes URL safety scans and triggers the creation phase if safe.
 */
export const createScanWorker = () => {
  console.log('--- [scanWorker] Initializing and listening on "scanQueue" ---');
  
  const worker = new Worker(
    'scanQueue',
    async (job: Job) => {
      const { longUrl, userId, shortCode, expiryDate } = job.data;
      console.log(`[scanWorker] [START] Job ${job.id} - URL: ${longUrl}`);
      
      try {
        const scanOutcome = await scanUrl(longUrl);
        console.log(`[scanWorker] [SUCCESS] Job ${job.id} - Result: ${scanOutcome.result}`);

        // If MALICIOUS, throw UnrecoverableError to discard immediately (no retry)
        if (scanOutcome.result !== 'safe') {
          console.warn(`[scanWorker] [BLOCKED] Job ${job.id}: URL blocked: ${scanOutcome.result}`);
          throw new UnrecoverableError(`URL blocked: ${scanOutcome.result}`);
        }

        // TRIGGER NEXT PHASE: Only if safe
        const urlRecord = await finalizeUrlCreation({
          longUrl,
          userId,
          shortCode,
          expiryDate,
          scanResult: scanOutcome.result,
          provider: scanOutcome.provider
        });

        // Return the record so waitForJob in Service layer gets it
        return urlRecord;

      } catch (error: any) {
        if (!(error instanceof UnrecoverableError)) {
          console.error(`[scanWorker] [FATAL] Job ${job.id} error:`, error);
        }
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

  worker.on('error', (err) => console.error('[scanWorker] Global Error:', err));
  worker.on('failed', (job, err) => {
    if (!err.message.includes('URL blocked')) {
      console.error(`[scanWorker] Job ${job?.id} failed unexpectedly:`, err);
    }
  });

  return worker;
};

// Singleton pattern to prevent multiple workers in Dev (HMR)
const globalForWorkers = global as unknown as { scanWorker: Worker };
export const scanWorker = globalForWorkers.scanWorker || createScanWorker();

if (process.env.NODE_ENV !== 'production') {
  globalForWorkers.scanWorker = scanWorker;
}
