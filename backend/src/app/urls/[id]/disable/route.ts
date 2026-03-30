import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../utils/auth';
import { getUrlById, checkUrlOwnership } from '../../../../models/url.model';
import { disableUrl } from '../../../../services/url.service';
import { deleteUrlCache } from '../../../../services/cache.service';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const id = parseInt(params.id, 10);

    const isOwner = await checkUrlOwnership(id, user.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let urlRecord = await getUrlById(id);
    if (!urlRecord) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await disableUrl(id);
    await deleteUrlCache(urlRecord.short_code);

    return NextResponse.json({ message: 'URL disabled' });
  } catch (error: any) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
