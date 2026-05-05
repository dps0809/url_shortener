import { scanWorker } from '../workers/scan.worker';
import { linkCreationWorker } from '../workers/linkCreation.worker';
import { qrWorker } from '../workers/qr.worker';
import { analyticsWorker } from '../workers/analytics.worker';
import { maintenanceWorker } from '../workers/maintenance.worker';
import { loggingWorker } from '../workers/logging.worker';
import { maintenanceQueue } from '../queues/maintenance.queue';

/**
 * Worker Coordination Service
 * Provides life-cycle hooks for background workers.
 */

// Schedule Repeatable Maintenance Tasks
export const startAllWorkers = async () => {
  console.log('\n--- [workerService] Initializing Background Pipelines ---');

  // Trigger worker initializations (ensure singletons are created)
  const workers = [
    scanWorker,
    linkCreationWorker,
    qrWorker,
    analyticsWorker,
    maintenanceWorker,
    loggingWorker
  ];

  console.log(`✓ [workerService] ${workers.length} workers active.`);

  // Clear existing repeatable jobs to avoid duplicates if necessary
  const repeatableJobs = await maintenanceQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await maintenanceQueue.removeRepeatableByKey(job.key);
  }

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

  return workers;
};
