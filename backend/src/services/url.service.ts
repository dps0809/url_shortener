import { getUrlsByUser, updateExpiryDate, disableUrl as disableUrlModel, enableUrl as enableUrlModel, softDeleteUrl, checkShortCodeExists, UrlRecord } from '../models/url.model';
import { addScanJob, scanQueue } from '../queues/scan.queue';
import { addLinkCreationJob, linkCreationQueue } from '../queues/linkCreation.queue';
import { addQRJob } from '../queues/qr.queue';
import { addAnalyticsJob } from '../queues/analytics.queue';
import { addLoggingJob } from '../queues/logging.queue';
import { checkCreationLimit } from './rateLimit.service';

import { customAlphabet } from 'nanoid';

const generateUniqueShortCode = async (): Promise<string> => {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = nanoid();
    const exists = await checkShortCodeExists(code);
    if (!exists) return code;
  }
  throw new Error('Failed to generate unique short code after 10 attempts');
}

async function waitForJob(queue: any, job: any, timeoutMs = 20000): Promise<any> {
  const start = Date.now();
  console.log(`[waitForJob] START: Waiting for job ${job.id} on queue ${queue.name}...`);
  
  let pollCount = 0;
  while (Date.now() - start < timeoutMs) {
    pollCount++;
    const currentJob = await queue.getJob(job.id);
    
    if (!currentJob) {
      console.warn(`[waitForJob] WARNING: Job ${job.id} not found in ${queue.name} during poll ${pollCount}. Continuing...`);
      // Most likely handled already if it disappeared suddenly.
      // But let's pause and retry once more before giving up.
      await new Promise(resolve => setTimeout(resolve, 500));
      continue; 
    }

    const state = await currentJob.getState();
    console.log(`[waitForJob] Poll ${pollCount}: Job ${job.id} state is "${state}" (Elapsed: ${Date.now() - start}ms)`);
    
    if (state === 'completed') {
      console.log(`[waitForJob] SUCCESS: Job ${job.id} completed. Return value:`, currentJob.returnvalue);
      return currentJob.returnvalue;
    }
    
    if (state === 'failed') {
      console.error(`[waitForJob] FAILED: Job ${job.id} failed. Reason:`, currentJob.failedReason);
      throw new Error(currentJob.failedReason || 'Job failed');
    }

    // Small delay before next poll
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  
  throw new Error(`Job ${job.id} on queue ${queue.name} timed out after ${timeoutMs}ms (Polls: ${pollCount}, State: unknown)`);
}

export const finalizeUrlCreation = async (data: {
  longUrl: string;
  userId: number | null;
  shortCode: string;
  expiryDate?: string;
  scanResult: string;
  provider?: string;
}): Promise<UrlRecord> => {
  const { longUrl, userId, shortCode, expiryDate, scanResult, provider } = data;
  
  // 1. Create the URL record
  const createJob = await addLinkCreationJob({
    longUrl,
    userId,
    shortCode,
    expiryDate,
    provider,
    scanResult,
  });

  // We wait for the creation job because the ScanWorker (the driver) needs to return it
  // and the API is waiting for the ScanWorker.
  const urlRecord = await waitForJob(linkCreationQueue, createJob);
  console.log(`[finalizeUrlCreation] URL Created: ${urlRecord.short_code}`);

  // 2. Async Fan-out (Non-blocking)
  (async () => {
    try {
      console.log(`[finalizeUrlCreation] Fanning out background tasks for: ${urlRecord.short_code}`);
      
      await addQRJob('generate-qr', { 
        urlId: urlRecord.id || urlRecord.url_id, 
        shortCode: urlRecord.short_code 
      });

      await addAnalyticsJob('setup', { 
        urlId: urlRecord.id || urlRecord.url_id, 
        shortCode: urlRecord.short_code 
      });

      await addLoggingJob('log-creation', {
        action: 'URL_CREATED',
        userId: userId,
        urlId: urlRecord.id || urlRecord.url_id,
        shortCode: urlRecord.short_code,
        longUrl: longUrl
      });

      console.log(`[finalizeUrlCreation] Fan-out complete for: ${urlRecord.short_code}`);
    } catch (err) {
      console.error('[finalizeUrlCreation] Background fan-out FAILED:', err);
    }
  })();

  return urlRecord;
};

export const createShortUrl = async (longUrl: string, userId: number | null, customAlias?: string, expiryDate?: Date): Promise<UrlRecord> => {
  console.log(`[createShortUrl] starting for ${longUrl}`);
  console.time('[createShortUrl] total');

  if (userId !== null) {
    const isAllowed = await checkCreationLimit(userId);
    if (!isAllowed) throw new Error('Rate limit exceeded');
  }

  if (customAlias) {
    const isAvailable = await checkAliasAvailability(customAlias);
    if (!isAvailable) throw new Error('Alias already in use');
  }

  const shortCode = customAlias || (await generateUniqueShortCode());
  const expiryStr = expiryDate ? expiryDate.toISOString() : undefined;

  try {
    // SINGLE POINT OF ENTRY: The Scan Job drives the rest of the pipeline
    const scanJob = await addScanJob({ longUrl, userId, shortCode, expiryDate: expiryStr });
    
    // The ScanWorker will now return the full UrlRecord (via finalizeUrlCreation)
    const urlRecord = await waitForJob(scanQueue, scanJob);
    
    console.log('[createShortUrl] Pipeline Success:', urlRecord.short_code);
    console.timeEnd('[createShortUrl] total');
    return urlRecord;

  } catch (error: any) {
    console.timeEnd('[createShortUrl] total');
    const errorMessage = error?.message || 'Unknown error';
    
    if (errorMessage.includes('URL blocked')) {
      console.warn(`[createShortUrl] URL security block: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    console.error('[createShortUrl] PIPELINE FAILURE:', errorMessage);
    throw error;
  }
};

export const getUserUrls = async (userId: number, limit: number = 10, offset: number = 0) => {
  return await getUrlsByUser(userId, limit, offset);
};

export const updateExpiry = async (id: number, expiryDate: Date) => {
  return await updateExpiryDate(id, expiryDate);
};

export const disableUrl = async (id: number) => {
  return await disableUrlModel(id);
};

export const enableUrl = async (id: number) => {
  return await enableUrlModel(id);
};

export const deleteUrl = async (id: number) => {
  return await softDeleteUrl(id);
};

export const checkAliasAvailability = async (code: string) => {
  const exists = await checkShortCodeExists(code);
  return !exists;
};
