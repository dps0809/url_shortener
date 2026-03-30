import { Job } from 'bullmq';
import { getUrlsByUser, updateExpiryDate, disableUrl as disableUrlModel, enableUrl as enableUrlModel, softDeleteUrl, checkShortCodeExists, UrlRecord } from '../models/url.model';
import { 
  enqueueScanJob, 
  scanQueueEvents, 
  enqueueLinkCreationJob, 
  linkCreationQueueEvents,
  ScanQueueJobData,
  LinkCreationQueueJobData
} from './queue.service';
import { checkCreationLimit } from './rateLimit.service';

function generateCandidateCode(): string {
  return Math.random().toString(36).substring(2, 8);
}

async function generateUniqueShortCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateCandidateCode();
    const exists = await checkShortCodeExists(code);
    if (!exists) return code;
  }
  throw new Error('Failed to generate unique short code');
}

export const createShortUrl = async (longUrl: string, userId: number, customAlias?: string, expiryDate?: Date) => {
  // 1. Pre-validation
  const isAllowed = await checkCreationLimit(userId);
  if (!isAllowed) throw new Error('Rate limit exceeded');

  if (customAlias) {
    const isAvailable = await checkAliasAvailability(customAlias);
    if (!isAvailable) throw new Error('Alias already in use');
  }

  // 2. Step 1: Malicious Scan
  const scanJobData: ScanQueueJobData = {
    longUrl,
    userId,
    customAlias,
    expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
  };

  const scanJob: Job = await enqueueScanJob(scanJobData);
  const scanResult = await scanJob.waitUntilFinished(scanQueueEvents);
  // scan.worker throws if malicious, so if we reach here, it is safe.

  // 3. Step 2: Database Creation
  const shortCode = customAlias || (await generateUniqueShortCode());
  const creationData: LinkCreationQueueJobData = {
    longUrl,
    userId,
    shortCode,
    expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
    provider: (scanResult as any).provider,
    scanResult: (scanResult as any).result,
  };

  const creationJob: Job = await enqueueLinkCreationJob(creationData);
  const urlRecord = (await creationJob.waitUntilFinished(linkCreationQueueEvents)) as UrlRecord;

  // 4. Return to User
  return urlRecord;
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
