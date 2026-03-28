import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { query } from '../utils/db';
import { checkLinkHealth } from './linkHealth.service';
import { scanUrl } from './scan.service';
import { checkExpiredUrls } from './expiry.service';
import { generateQRCode } from './qr.service';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const syncClickCounters = () => {
  new Worker('analyticsSync', async job => {
    const { shortCode, ipAddress, userAgent, timestamp } = job.data;
    await query(`UPDATE urls SET click_count = click_count + 1 WHERE short_code = $1`, [shortCode]);
    
    const urlResult = await query(`SELECT id FROM urls WHERE short_code = $1`, [shortCode]);
    if (urlResult.rows[0]) {
      const urlId = urlResult.rows[0].id;
      await query(
        `INSERT INTO analytics (url_id, ip_address, user_agent, clicked_at) VALUES ($1, $2, $3, $4)`,
        [urlId, ipAddress, userAgent, timestamp]
      );
    }
  }, { connection });
};

export const runDeadLinkScan = () => {
  // Can be called periodically by chron or similar, here we run the worker processing requests
  checkLinkHealth();
};

export const runMalwareScan = () => {
  new Worker('scanJob', async job => {
    const { urlId, longUrl, userId } = job.data;
    await scanUrl(urlId, longUrl, userId);
  }, { connection });
};

export const cleanupExpiredLinks = () => {
  // Scheduled job process
  checkExpiredUrls();
};
