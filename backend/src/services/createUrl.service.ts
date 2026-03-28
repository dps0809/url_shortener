import { createUrl, checkShortCodeExists } from '../models/url.model';
import { cacheUrl, enforceCreateUrlRateLimit } from '../models/cache.model';
// Assume queues are exported from src/queues/index.ts or similar
// For now, we'll import linkCreationQueue from a dedicated queue file, we'll assume it exists or will be created
import { linkCreationQueue } from '../queues/linkCreation.queue';
import { customAlphabet } from 'nanoid';

const generateCode = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

export interface CreateUrlResult {
  success: boolean;
  message?: string;
  data?: any;
}

export const createUrlService = async (
  longUrl: string,
  userId: number,
  customAlias?: string,
  expiryDate?: Date
): Promise<CreateUrlResult> => {
  // 1. Rate Limit Check
  const isAllowed = await enforceCreateUrlRateLimit(userId);
  if (!isAllowed) {
    return { success: false, message: 'Daily URL creation limit exceeded' };
  }

  // 2. Determine Short Code
  let shortCode: string;
  if (customAlias) {
    // Check availability
    const exists = await checkShortCodeExists(customAlias);
    if (exists) {
      return { success: false, message: 'Custom alias is already in use' };
    }
    shortCode = customAlias;
  } else {
    // Generate unique short code
    let isUnique = false;
    let attempts = 0;
    let generated = '';
    while (!isUnique && attempts < 5) {
      generated = generateCode();
      const exists = await checkShortCodeExists(generated);
      if (!exists) isUnique = true;
      attempts++;
    }
    if (!isUnique) {
      return { success: false, message: 'Failed to generate unique short code' };
    }
    shortCode = generated;
  }

  // 3. Create URL in DB
  const urlRecord = await createUrl(shortCode, longUrl, userId, expiryDate || null);
  if (!urlRecord) {
    return { success: false, message: 'Database error occurred while creating URL' };
  }

  // 4. Cache in Redis (optional, usually redirect cache happens on first miss, but we can pre-warm)
  await cacheUrl(shortCode!, longUrl);

  // 5. Add Job to LinkCreation Queue (cascades to QR and Scan)
  await linkCreationQueue.add('processLinkCreation', {
    urlId: urlRecord.id,
    shortCode: urlRecord.short_code,
    longUrl: urlRecord.long_url
  });

  return { success: true, data: urlRecord };
};
