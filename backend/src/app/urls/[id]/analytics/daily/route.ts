import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../utils/auth';
import { checkUrlOwnership } from '../../../../../models/url.model';
import { getDailyAnalytics } from '../../../../../services/analytics.service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const id = parseInt(params.id, 10);

    const isOwner = await checkUrlOwnership(id, user.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');

    const endDate = endParam ? new Date(endParam) : new Date();
    const startDate = startParam ? new Date(startParam) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days

    const dailyStats = await getDailyAnalytics(id, startDate, endDate);

    // Format dates to return shape like { "date": "YYYY-MM-DD", "clicks": 200 }
    const formattedStats = dailyStats.map(stat => ({
      date: new Date(stat.date).toISOString().split('T')[0],
      clicks: parseInt(stat.clicks, 10)
    }));

    return NextResponse.json(formattedStats);
  } catch (error: any) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
