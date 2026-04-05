import { NextRequest } from 'next/server';
import { healthCheckHandler } from '@/backend/src/routes/system.routes';

export async function GET(req: NextRequest) {
  return healthCheckHandler();
}
