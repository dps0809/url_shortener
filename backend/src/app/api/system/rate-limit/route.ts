import { NextRequest } from 'next/server';
import { getRateLimitHandler } from '../../../../routes/system.routes';

export async function GET(request: NextRequest) {
  return await getRateLimitHandler(request);
}
