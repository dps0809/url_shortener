import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../utils/auth';
import { checkUrlOwnership } from '../../../../models/url.model';
import { getTotalClicks } from '../../../../services/analytics.service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const id = parseInt(params.id, 10);

    const isOwner = await checkUrlOwnership(id, user.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const totalClicks = await getTotalClicks(id);

    return NextResponse.json({ total_clicks: parseInt(totalClicks, 10) });
  } catch (error: any) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
