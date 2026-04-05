import { NextRequest } from 'next/server';
import { getStatusHandler } from '../../../../../routes/lifecycle.routes';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return await getStatusHandler(request, { params });
}
