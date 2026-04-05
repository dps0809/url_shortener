import { NextRequest } from 'next/server';
import { getQueueStatusHandler } from '../../../../routes/internal.routes';

export async function GET(request: NextRequest) {
  return await getQueueStatusHandler(request);
}
