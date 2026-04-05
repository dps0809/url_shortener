import { NextRequest } from 'next/server';
import { redirectHandler } from '../../../routes/url.routes';

export async function GET(
  request: NextRequest,
  { params }: { params: { short_code: string } }
) {
  return await redirectHandler(request, { params });
}
