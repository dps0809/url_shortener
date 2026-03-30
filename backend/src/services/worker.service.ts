import { redis } from '../utils/redis';
import { query } from '../utils/db';
import { scanWorker } from '../workers/scan.worker';
import { linkCreationWorker } from '../workers/linkCreation.worker';
import { qrWorker } from '../workers/qr.worker';
import { analyticsWorker } from '../workers/analytics.worker';
import { loggingWorker } from '../workers/logging.worker';
import { deadLinkWorker } from '../workers/deadLink.worker';
import { expiryWorker } from '../workers/expiry.worker';
import { maintenanceQueue } from '../queues/maintenance.queue';

// Start and Schedule Workers
export const startAllWorkers = async () => {
  console.log('--- Starting URL Shortener Background Workers ---');
  
  // Handled by worker file imports/declarations
  console.log('✓ Workers initialized');

  // Schedule Maintenance Tasks (Repeatable Jobs)
  
  // 1. Analytics Sync - Every 30 minutes
  await maintenanceQueue.add(
    'click_sync',
    { task: 'click_sync' },
    { repeat: { every: 30 * 60 * 1000 }, jobId: 'analytics_sync_job' }
  );
  console.log('✓ Scheduled: Analytics Sync (30 min)');

  // 2. Dead Link Detection - Every 1 hour
  await maintenanceQueue.add(
    'dead_link_scan',
    { task: 'dead_link_scan' },
    { repeat: { every: 60 * 60 * 1000 }, jobId: 'dead_link_scan_job' }
  );
  console.log('✓ Scheduled: Dead Link Detection (1 hour)');

  // 3. Expiry Cleanup - Every 10 minutes
  await maintenanceQueue.add(
    'expiry_scan',
    { task: 'expiry_scan' },
    { repeat: { every: 10 * 60 * 1000 }, jobId: 'expiry_cleanup_job' }
  );
  console.log('✓ Scheduled: Expiry Cleanup (10 min)');
};

// Logic helpers (kept for direct manual trigger if needed)
export const syncClickCounters = async () => {
  try {
    const keys = await redis.keys('clicks:*');
    for (const key of keys) {
      const code = key.replace('clicks:', '');
      const clicksStr = await redis.get(key);
      const clicks = parseInt(clicksStr || '0', 10);
      
      if (clicks > 0) {
        await query('UPDATE urls SET click_count = click_count + $1 WHERE short_code = $2', [clicks, code]);
        await redis.decrby(key, clicks);
      }
    }
  } catch (error) {
    console.error('Failed to sync click counters:', error);
  }
};
