import { getUrlByShortCode } from '../models/url.model';
import { getUrlCache, setUrlCache } from './cache.service';
import { checkRedirectLimit } from './rateLimit.service';
import { enqueueAnalyticsSync } from './queue.service';

export const resolveShortUrl = async (shortCode: string, ipAddress: string, userAgent: string) => {
  const isAllowed = await checkRedirectLimit(ipAddress);
  if (!isAllowed) throw new Error('Rate limit exceeded');

  let longUrl = await getUrlCache(shortCode);
  
  if (!longUrl) {
    const urlRecord = await getUrlByShortCode(shortCode);
    if (!urlRecord) throw new Error('URL not found');
    if (urlRecord.status === 'expired') throw new Error('URL has expired');
    if (urlRecord.status === 'disabled') throw new Error('URL is disabled');
    if (urlRecord.status === 'malicious') throw new Error('URL is flagged as malicious');
    if (urlRecord.status === 'dead') throw new Error('URL is dead');

    longUrl = urlRecord.long_url;
    await cacheRedirect(shortCode, longUrl);
  }

  await incrementClickCounter(shortCode, ipAddress, userAgent);
  return longUrl;
};

export const cacheRedirect = async (shortCode: string, longUrl: string) => {
  await setUrlCache(shortCode, longUrl, 3600); // cache for 1 hour
};

export const incrementClickCounter = async (shortCode: string, ipAddress: string, userAgent: string) => {
  await enqueueAnalyticsSync({ shortCode, ipAddress, userAgent, timestamp: new Date() });
};
