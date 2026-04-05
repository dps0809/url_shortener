import { NextRequest, NextResponse } from 'next/server';
import { getQRCodeByUrlId } from '../models/qr.model';
import { withAuth, isAuthError } from '../middleware/auth.middleware';
import { validateIdParam } from '../validators/url.validator';

/**
 * 14. GET /urls/:id/qrcode - Return QR code for the short link
 */
export async function getQrCodeHandler(req: NextRequest, { params }: { params: { id: string } }) {
  // ── Auth gate ──
  const authResult = await withAuth(req);
  if (isAuthError(authResult)) return authResult;

  // ── Param validation ──
  const idError = validateIdParam(params.id);
  if (idError) return idError;
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
