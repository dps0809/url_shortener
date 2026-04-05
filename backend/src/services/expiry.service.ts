import { query } from '../utils/db';
import { getExpiredUrls, markUrlExpired } from '../models/url.model';
import { deleteUrlCache } from './cache.service';

export const checkExpiredUrls = async () => {
  const expiredUrls = await getExpiredUrls();
  
  for (const url of expiredUrls) {
    await markExpiredUrl(url.id);
    
    // Also fetch shortCode to clear cache
    const urlData = await query(`SELECT short_code FROM urls WHERE url_id = $1`, [url.id]);
    if (urlData.rows[0]) {
       await clearExpiredCache(urlData.rows[0].short_code);
    }
  }
};

export const markExpiredUrl = async (id: number) => {
  await markUrlExpired(id);
};

export const clearExpiredCache = async (shortCode: string) => {
  await deleteUrlCache(shortCode);
};
