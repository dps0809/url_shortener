import { NextRequest } from 'next/server';
import { getQrCodeHandler } from '@/backend/src/routes/qrcode.routes';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return getQrCodeHandler(req, { params: resolvedParams });
}
