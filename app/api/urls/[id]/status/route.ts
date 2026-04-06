import { NextRequest } from 'next/server';
import { getStatusHandler } from '@/backend/src/routes/lifecycle.routes';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return getStatusHandler(req, { params: resolvedParams });
}
