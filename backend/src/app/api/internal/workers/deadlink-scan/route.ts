import { NextRequest } from 'next/server';
import { triggerDeadlinkScanHandler } from '../../../../../routes/internal.routes';

export async function POST(request: NextRequest) {
  return await triggerDeadlinkScanHandler(request);
}
