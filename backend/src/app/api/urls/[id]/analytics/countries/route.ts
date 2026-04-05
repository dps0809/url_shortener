import { NextRequest } from 'next/server';
import { getCountryAnalyticsHandler } from '../../../../../../routes/analytics.routes';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return await getCountryAnalyticsHandler(request, { params });
}
