import { NextRequest } from 'next/server';
import { triggerClickSyncHandler } from '../../../../../routes/internal.routes';

export async function POST(request: NextRequest) {
  return await triggerClickSyncHandler(request);
}
