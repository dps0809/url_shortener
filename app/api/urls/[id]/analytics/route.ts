import { NextRequest } from 'next/server';
import { getDailyAnalyticsHandler } from '@/backend/src/routes/analytics.routes';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return getDailyAnalyticsHandler(req, { params: resolvedParams });
}
