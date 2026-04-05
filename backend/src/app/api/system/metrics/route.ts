import { NextRequest } from 'next/server';
import { getMetricsHandler } from '../../../../routes/system.routes';

export async function GET() {
  return await getMetricsHandler();
}
