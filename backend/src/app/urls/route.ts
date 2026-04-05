import { NextRequest } from 'next/server';
import { createUrlHandler, listUrlsHandler } from '../../routes/url.routes';

export async function POST(request: NextRequest) {
  return await createUrlHandler(request);
}

export async function GET(request: NextRequest) {
  return await listUrlsHandler(request);
}
