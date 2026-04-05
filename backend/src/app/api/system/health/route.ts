import { NextRequest } from 'next/server';
import { healthCheckHandler } from '../../../../routes/system.routes';

export async function GET() {
  return await healthCheckHandler();
}
