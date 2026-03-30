import { NextRequest, NextResponse } from 'next/server';
import { enqueueMaintenanceJob } from '../../../services/queue.service';

export async function POST(request: NextRequest) {
  try {
    // In production, add a secret header check here to restrict access to internal services
    // if (request.headers.get('x-internal-secret') !== process.env.INTERNAL_SECRET) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    await enqueueMaintenanceJob({ task: 'dead_link_scan' });

    return NextResponse.json({ message: 'Dead link scan job enqueued' }, { status: 202 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
