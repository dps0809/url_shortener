import { NextRequest, NextResponse } from 'next/server';
import { 
  enqueueMaintenanceJob, 
  enqueueMalwareScan,
  scanQueue,
  linkCreationQueue,
  qrQueue,
  analyticsQueue,
  maintenanceQueue,
  loggingQueue,
  getActiveWorkerCount
} from '../services/queue.service';
import { validateMalwareScanBody } from '../validators/url.validator';

/**
 * Internal Security Check
 */
const checkInternalAuth = (req: NextRequest) => {
  const authHeader = req.headers.get('x-internal-secret');
  return authHeader === process.env.INTERNAL_API_SECRET;
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
    const body = await req.json();

    // ── Input validation ──
    const validationError = validateMalwareScanBody(body);
    if (validationError) return validationError;

    await enqueueMalwareScan(body.url_id, body.long_url);
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
      loggingWaiting,
      workerInfo
    ] = await Promise.all([
      scanQueue.getWaitingCount(),
      linkCreationQueue.getWaitingCount(),
      qrQueue.getWaitingCount(),
      analyticsQueue.getWaitingCount(),
      maintenanceQueue.getWaitingCount(),
      loggingQueue.getWaitingCount(),
      getActiveWorkerCount()
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
      active_workers: workerInfo.total,
      worker_detail: workerInfo.detail
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
