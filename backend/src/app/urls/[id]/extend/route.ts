import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../utils/auth';
import { getUrlById, checkUrlOwnership } from '../../../../models/url.model';
import { updateExpiry } from '../../../../services/url.service';
import { setUrlCache, deleteUrlCache } from '../../../../services/cache.service';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const id = parseInt(params.id, 10);

    const isOwner = await checkUrlOwnership(id, user.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { expiry_date } = body;
    
    if (!expiry_date) {
      return NextResponse.json({ error: 'expiry_date is required' }, { status: 400 });
    }

    const updated = await updateExpiry(id, new Date(expiry_date));
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    const now = new Date();
    const expiry = new Date(expiry_date);
    const ttlInSeconds = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 1000));
    
    if (ttlInSeconds > 0) {
      await setUrlCache(updated.short_code, updated.long_url, ttlInSeconds);
    } else {
      await deleteUrlCache(updated.short_code);
    }

    return NextResponse.json({ message: 'URL expiry extended successfully' });
  } catch (error: any) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
