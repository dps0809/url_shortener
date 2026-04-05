import { getUrlsByUser, updateExpiryDate, disableUrl as disableUrlModel, enableUrl as enableUrlModel, softDeleteUrl, checkShortCodeExists, createUrl, UrlRecord } from '../models/url.model';
import { qrQueue } from '../queues/qr.queue';
import { analyticsQueue } from '../queues/analytics.queue';
import { loggingQueue } from '../queues/logging.queue';
import { checkCreationLimit } from './rateLimit.service';
import { scanUrl } from './scan.service';

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

export const createShortUrl = async (longUrl: string, userId: number, customAlias?: string, expiryDate?: Date) => {
  console.time('[createShortUrl] total');

  // 1. Pre-validation: rate limit
  console.time('[createShortUrl] rateLimit');
  const isAllowed = await checkCreationLimit(userId);
  if (!isAllowed) throw new Error('Rate limit exceeded');
  console.timeEnd('[createShortUrl] rateLimit');

  if (customAlias) {
    const isAvailable = await checkAliasAvailability(customAlias);
    if (!isAvailable) throw new Error('Alias already in use');
  }

  // 2. DIRECT malware scan (no BullMQ overhead)
  console.time('[createShortUrl] scanUrl');
  const scanResult = await scanUrl(longUrl);
  console.timeEnd('[createShortUrl] scanUrl');

  if (scanResult.result !== 'safe') {
    throw new Error(`URL blocked: ${scanResult.result} (provider: ${scanResult.provider})`);
  }

  // 3. DIRECT database insert (no BullMQ overhead)
  console.time('[createShortUrl] dbInsert');
  const shortCode = customAlias || (await generateUniqueShortCode());
  const expiry = expiryDate || null;
  const urlRecord = await createUrl(shortCode, longUrl, userId, expiry);
  if (!urlRecord) throw new Error('Failed to create URL record in DB');
  console.timeEnd('[createShortUrl] dbInsert');

  // 4. ASYNC fan-out (fire-and-forget via BullMQ — these don't block)
  const urlId = urlRecord.url_id ?? urlRecord.id;
  qrQueue.add('generate', { urlId, shortCode: urlRecord.short_code }).catch(e => console.error('QR enqueue failed:', e));
  analyticsQueue.add('setup', { urlId, shortCode: urlRecord.short_code }).catch(e => console.error('Analytics enqueue failed:', e));
  loggingQueue.add('log', {
    action: 'URL_CREATED',
    userId,
    urlId,
    shortCode: urlRecord.short_code,
    longUrl: urlRecord.long_url,
    provider: scanResult.provider,
    scanResult: scanResult.result,
  }).catch(e => console.error('Logging enqueue failed:', e));

  console.timeEnd('[createShortUrl] total');
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
