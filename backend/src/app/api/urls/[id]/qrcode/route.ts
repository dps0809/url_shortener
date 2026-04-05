import { NextRequest } from 'next/server';
import { getQrCodeHandler } from '../../../../../routes/qrcode.routes';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return await getQrCodeHandler(request, { params });
}
