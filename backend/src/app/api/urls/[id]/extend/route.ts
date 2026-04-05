import { NextRequest } from 'next/server';
import { extendUrlHandler } from '../../../../../routes/lifecycle.routes';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return await extendUrlHandler(request, { params });
}
