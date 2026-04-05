import { NextRequest } from 'next/server';
import { getDailyAnalyticsHandler } from '../../../../../../routes/analytics.routes';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return await getDailyAnalyticsHandler(request, { params });
}
