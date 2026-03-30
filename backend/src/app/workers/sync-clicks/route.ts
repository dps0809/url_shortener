import { NextRequest, NextResponse } from 'next/server';
import { enqueueMaintenanceJob } from '../../../services/queue.service';

export async function POST(request: NextRequest) {
  try {
    // Enqueue a maintenance job for click synchronization
    await enqueueMaintenanceJob({ task: 'click_sync' });

    return NextResponse.json({ message: 'Click sync job enqueued' }, { status: 202 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
