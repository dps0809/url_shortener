import { Job, Worker } from 'bullmq';
import { redis } from '../utils/redis';
import { scanUrl, storeScanResult } from '../services/scan.service';
import { ScanQueueJobData } from '../queues/scan.queue';
import { MaintenanceQueueJobData } from '../queues/maintenance.queue';

// 1. Worker for new URL creations (scanQueue)
export const scanWorker = new Worker(
  'scanQueue',
  async (job: Job<ScanQueueJobData>): Promise<{ result: string; provider: string }> => {
    const { longUrl } = job.data;
    const scanOutcome = await scanUrl(longUrl);

    if (scanOutcome.result !== 'safe') {
      throw new Error(`URL blocked: ${scanOutcome.result}`);
    }

    return { result: scanOutcome.result, provider: scanOutcome.provider };
  },
  { connection: redis, concurrency: 10 }
);

// 2. Worker for manual malware scans (maintenanceQueue)
export const malwareScanWorker = new Worker(
  'maintenanceQueue',
  async (job: Job<MaintenanceQueueJobData>) => {
    if (job.data?.task !== 'malware_scan') return;

    const { urlId, originalUrl } = job.data;
    if (urlId && originalUrl) {
      console.log(`[malwareScanWorker] Manually scanning URL ${urlId}: ${originalUrl}`);
      const scanOutcome = await scanUrl(originalUrl);
      await storeScanResult(urlId, scanOutcome.result, scanOutcome.provider);
      return { ok: true, result: scanOutcome.result };
    }
    
    return { ok: false, error: 'Missing urlId or originalUrl' };
  },
  { connection: redis, concurrency: 5 }
);
