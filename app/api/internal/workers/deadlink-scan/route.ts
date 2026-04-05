import { NextRequest } from 'next/server';
import { triggerDeadlinkScanHandler } from '@/backend/src/routes/internal.routes';

export async function POST(req: NextRequest) {
  return triggerDeadlinkScanHandler(req);
}
