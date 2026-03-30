import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../utils/auth';
import { checkUrlOwnership } from '../../../../models/url.model';
import { enableUrl } from '../../../../services/url.service';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const id = parseInt(params.id, 10);

    const isOwner = await checkUrlOwnership(id, user.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await enableUrl(id);
    // Redis cache will be recreated on next request automatically

    return NextResponse.json({ message: 'URL enabled' });
  } catch (error: any) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
