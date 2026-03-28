import { redis, delCache } from '../utils/redis';
import pool from '../utils/db';
import fetch from 'node-fetch'; 

export async function deadLinkWorker() {
  try {
    // Fetch active URLs
    const res = await pool.query(`SELECT id, "originalUrl", "shortCode" FROM urls WHERE status = 'ACTIVE'`);
    const activeUrls = res.rows;

    const BATCH_SIZE = 50;

    for (let i = 0; i < activeUrls.length; i += BATCH_SIZE) {
      const batch = activeUrls.slice(i, i + BATCH_SIZE);
      
      await Promise.allSettled(batch.map(async (urlRecord) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(urlRecord.originalUrl, {
            method: 'HEAD',
            signal: controller.signal as any,
          });
          clearTimeout(timeoutId);

          if (response.status === 404 || response.status >= 500) {
            // mark dead
            await pool.query(`UPDATE urls SET status = 'DISABLED' WHERE id = $1`, [urlRecord.id]);

            // DEL short:{code} from Redis
            await delCache(`short:${urlRecord.shortCode}`);

            console.log(`URL ${urlRecord.shortCode} marked dead (${response.status})`);
          }
        } catch (err: any) {
          if (err.name === 'AbortError') return; // ignore timeouts
          console.error(`Error checking dead link ${urlRecord.shortCode}`, err.message);
        }
      }));
    }
  } catch (error) {
    console.error('Dead link worker error:', error);
  }
}
