import { NextRequest, NextResponse } from 'next/server';
import { getQRCodeByUrlId } from '../models/qr.model';

/**
 * 14. GET /urls/:id/qrcode - Return QR code for the short link
 */
export async function getQrCodeHandler(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  try {
    const qrRecord = await getQRCodeByUrlId(id);
    if (!qrRecord) {
      return NextResponse.json({ error: 'QR code not found yet. It might be generating.' }, { status: 404 });
    }

    return NextResponse.json({
      qr_code: qrRecord.qr_image_url
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
