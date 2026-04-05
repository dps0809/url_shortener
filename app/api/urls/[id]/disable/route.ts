import { NextRequest } from 'next/server';
import { disableUrlHandler } from '@/backend/src/routes/lifecycle.routes';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return disableUrlHandler(req, { params: resolvedParams });
}
