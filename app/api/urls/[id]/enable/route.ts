import { NextRequest } from 'next/server';
import { enableUrlHandler } from '@/backend/src/routes/lifecycle.routes';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return enableUrlHandler(req, { params: resolvedParams });
}
