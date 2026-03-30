import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../utils/auth';
import { checkUrlOwnership } from '../../../../../models/url.model';
import { getCountryAnalytics } from '../../../../../services/analytics.service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const id = parseInt(params.id, 10);

    const isOwner = await checkUrlOwnership(id, user.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const countries = await getCountryAnalytics(id);

    const formattedStats = countries.map(stat => ({
      country: stat.country || 'Unknown',
      clicks: parseInt(stat.clicks, 10)
    }));

    return NextResponse.json(formattedStats);
  } catch (error: any) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
