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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shortUrl = `${baseUrl}/${url.short_code}`;

    await generateQRCode(urlId, shortUrl);

    return { ok: true };
  },
  {
    connection: redis,
    concurrency: 5,
  }
);
