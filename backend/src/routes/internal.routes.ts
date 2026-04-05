import { NextRequest, NextResponse } from 'next/server';
import { 
  enqueueMaintenanceJob, 
  enqueueMalwareScan,
  scanQueue,
  linkCreationQueue,
  qrQueue,
  analyticsQueue,
  maintenanceQueue,
  loggingQueue
} from '../services/queue.service';

/**
 * Internal Security Check (Middleware would be better, but implementing here for completeness)
 */
const checkInternalAuth = (req: NextRequest) => {
  const authHeader = req.headers.get('x-internal-secret');
  return authHeader === process.env.INTERNAL_API_SECRET || process.env.NODE_ENV === 'development';
};

/**
 * 18. POST /internal/workers/deadlink-scan - Trigger dead link detection
 */
export async function triggerDeadlinkScanHandler(req: NextRequest) {
  if (!checkInternalAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await enqueueMaintenanceJob({ task: 'dead_link_scan' });
    return NextResponse.json({ message: 'Dead link scan job enqueued' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 19. POST /internal/workers/sync-clicks - Flush Redis click counters to database
 */
export async function triggerClickSyncHandler(req: NextRequest) {
  if (!checkInternalAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await enqueueMaintenanceJob({ task: 'click_sync' });
    return NextResponse.json({ message: 'Click sync job enqueued' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 20. POST /internal/workers/scan-malware - Scan URLs for malicious content
 */
export async function triggerMalwareScanHandler(req: NextRequest) {
  if (!checkInternalAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { url_id, long_url } = await req.json();
    if (!url_id || !long_url) return NextResponse.json({ error: 'url_id and long_url are required' }, { status: 400 });

    await enqueueMalwareScan(url_id, long_url);
    return NextResponse.json({ message: 'Malware scan job enqueued' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 21. GET /internal/queues - Check job queue status
 */
export async function getQueueStatusHandler(req: NextRequest) {
  if (!checkInternalAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [
      scanWaiting, 
      creationWaiting, 
      qrWaiting, 
      analyticsWaiting, 
      maintenanceWaiting, 
      loggingWaiting
    ] = await Promise.all([
      scanQueue.getWaitingCount(),
      linkCreationQueue.getWaitingCount(),
      qrQueue.getWaitingCount(),
      analyticsQueue.getWaitingCount(),
      maintenanceQueue.getWaitingCount(),
      loggingQueue.getWaitingCount()
    ]);

    return NextResponse.json({
      queues: {
        scan: scanWaiting,
        creation: creationWaiting,
        qr: qrWaiting,
        analytics: analyticsWaiting,
        maintenance: maintenanceWaiting,
        logging: loggingWaiting
      },
      active_workers: 6 // Total worker files implemented
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
