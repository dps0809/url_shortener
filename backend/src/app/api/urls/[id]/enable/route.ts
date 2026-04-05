import { NextRequest } from 'next/server';
import { enableUrlHandler } from '../../../../../routes/lifecycle.routes';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return await enableUrlHandler(request, { params });
}
