import { NextRequest } from 'next/server';
import { getTotalClicksHandler } from '../../../../../routes/analytics.routes';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return await getTotalClicksHandler(request, { params });
}
