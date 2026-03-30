import { NextRequest, NextResponse } from 'next/server';
import { 
  scanQueue, 
  qrQueue, 
  analyticsQueue, 
  loggingQueue, 
  maintenanceQueue 
} from '../../../services/queue.service';

export async function GET(request: NextRequest) {
  try {
    const queues = [scanQueue, qrQueue, analyticsQueue, loggingQueue, maintenanceQueue];
    
    let pending_jobs = 0;
    let active_jobs = 0;

    for (const queue of queues) {
      const counts = await queue.getJobCounts('wait', 'active', 'delayed');
      pending_jobs += counts.wait + (counts.delayed || 0);
      active_jobs += counts.active;
    }

    return NextResponse.json({
      pending_jobs,
      active_jobs,
      queues_monitored: queues.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
