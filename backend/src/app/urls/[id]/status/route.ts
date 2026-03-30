import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../utils/auth';
import { getUrlById, checkUrlOwnership } from '../../../../models/url.model';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const id = parseInt(params.id, 10);

    const isOwner = await checkUrlOwnership(id, user.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const urlRecord = await getUrlById(id);
    if (!urlRecord) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: urlRecord.status,
      expires_at: urlRecord.expiry_date
    });
  } catch (error: any) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
