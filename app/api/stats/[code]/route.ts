import { NextRequest } from 'next/server';
import pool from '@/backend/src/utils/db';
import { requireAuth } from '@/backend/src/utils/auth';
import { getUrlByShortCode } from '@/backend/src/utils/queries/urls';
import { getStatsByUrlId } from '@/backend/src/utils/queries/stats';
import { getHealthByUrlId } from '@/backend/src/utils/queries/health';
import { getQrByUrlId } from '@/backend/src/utils/queries/qr';
import {
  getDailyBreakdown,
  getDeviceBreakdown,
  getCountryBreakdown,
  getTopReferrers,
} from '@/backend/src/utils/queries/clicks';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * GET /api/stats/[code] — Get analytics for a specific URL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const client = await pool.connect();
  try {
    const user = await requireAuth(request);
    const { code } = await params;

    // Get URL and verify ownership
    const url = await getUrlByShortCode(client, code);
    if (!url || url.user_id !== user.userId) {
      return Response.json({ error: 'URL not found' }, { status: 404 });
    }

    // Fetch all analytics data
    const [stats, health, qr, dailyClicks, deviceBreakdown, countryBreakdown, referrers] =
      await Promise.all([
        getStatsByUrlId(client, url.url_id),
        getHealthByUrlId(client, url.url_id),
        getQrByUrlId(client, url.url_id),
        getDailyBreakdown(client, url.url_id, 7),
        getDeviceBreakdown(client, url.url_id),
        getCountryBreakdown(client, url.url_id, 10),
        getTopReferrers(client, url.url_id, 10),
      ]);

    return Response.json({
      url: {
        shortCode: url.short_code,
        shortUrl: `${BASE_URL}/${url.short_code}`,
        longUrl: url.long_url,
        createdAt: url.created_at,
        clickCount: url.click_count,
        status: url.status,
        expiryDate: url.expiry_date,
        maxClicks: url.max_clicks,
        qrCodeUrl: qr?.qr_image_url || null,
      },
      stats: {
        dailyClicks: stats?.daily_clicks || 0,
        weeklyClicks: stats?.weekly_clicks || 0,
        monthlyClicks: stats?.monthly_clicks || 0,
        lastUpdated: stats?.last_updated || null,
      },
      health: {
        lastStatusCode: health?.last_status_code || null,
        isDead: health?.is_dead || false,
        lastCheckedAt: health?.last_checked_at || null,
        failureCount: health?.failure_count || 0,
      },
      charts: {
        last7Days: dailyClicks.map((d: Record<string, unknown>) => ({
          date: d.date,
          clicks: parseInt(d.clicks as string, 10),
        })),
        devices: deviceBreakdown.map((d: Record<string, unknown>) => ({
          device: d.device,
          count: parseInt(d.count as string, 10),
        })),
        countries: countryBreakdown.map((c: Record<string, unknown>) => ({
          country: c.country,
          count: parseInt(c.count as string, 10),
        })),
        referrers: referrers.map((r: Record<string, unknown>) => ({
          referrer: r.referrer,
          count: parseInt(r.count as string, 10),
        })),
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error('Stats error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
