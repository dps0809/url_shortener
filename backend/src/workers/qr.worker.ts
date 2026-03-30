import { Job, Worker } from 'bullmq';
import { redis } from '../utils/redis';
import { QRQueueJobData } from '../queues/qr.queue';
import { getUrlById } from '../models/url.model';
import { generateQRCode } from '../services/qr.service';

export const qrWorker = new Worker(
  'qrQueue',
  async (job: Job<QRQueueJobData>) => {
    const { urlId } = job.data;

    const url = await getUrlById(urlId);
    if (!url) throw new Error('URL not found');

    await generateQRCode(urlId, url.long_url);

    return { ok: true };
  },
  {
    connection: redis,
    concurrency: 5,
  }
);
