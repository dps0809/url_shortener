import { NextRequest } from 'next/server';
import pool from '@/backend/src/utils/db';
import { requireAuth } from '@/backend/src/utils/auth';
import { createShortUrl } from '@/backend/src/services/url.service';
import { checkAndIncrementUsage } from '@/backend/src/utils/queries/usage';
import { listUrlsByUser } from '@/backend/src/utils/queries/urls';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * POST /api/urls â€” Create a short URL
 */
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    // 1. Authenticate
    const user = await requireAuth(request);

    // 2. Check rate limit
    const rateLimit = await checkAndIncrementUsage(client, user.userId);
    if (!rateLimit.allowed) {
      return Response.json(
        { error: 'Rate limit exceeded. Max 100 URLs per day.', remaining: 0 },
        { status: 429 }
      );
    }

    // 3. Validate input
    const body = await request.json();
    const { longUrl, expiryDate, customAlias } = body;

    if (!longUrl || typeof longUrl !== 'string') {
      return Response.json(
        { error: 'longUrl is required and must be a string' },
        { status: 400 }
      );
    }

    try {
      new URL(longUrl);
    } catch {
      return Response.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const expiry = expiryDate ? new Date(expiryDate) : undefined;
    const url = await createShortUrl(longUrl, user.userId, customAlias, expiry);
    const shortUrl = `${BASE_URL}/${url.short_code}`;

    return Response.json(
      {
        message: 'Short URL created',
        url: {
          urlId: url.id,
          shortCode: url.short_code,
          shortUrl,
          longUrl: url.long_url,
          createdAt: url.created_at,
          expiryDate: url.expiry_date,
          status: url.status,
          safetyStatus: 'safe',
        },
        rateLimit: {
          remaining: rateLimit.remaining,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error('Create URL error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/**
 * GET /api/urls â€” List authenticated user's URLs (paginated)
 */
export async function GET(request: NextRequest) {
  const client = await pool.connect();
  try {
    const user = await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const { rows: urls, total } = await listUrlsByUser(client, user.userId, limit, offset);

    return Response.json({
      urls: urls.map((u: Record<string, unknown>) => ({
        urlId: u.url_id,
        shortCode: u.short_code,
        shortUrl: `${BASE_URL}/${u.short_code}`,
        longUrl: u.long_url,
        createdAt: u.created_at,
        expiryDate: u.expiry_date,
        maxClicks: u.max_clicks,
        clickCount: u.click_count,
        status: u.status,
        qrCodeUrl: u.qr_image_url,
        stats: {
          dailyClicks: (u.daily_clicks as number) || 0,
          weeklyClicks: (u.weekly_clicks as number) || 0,
          monthlyClicks: (u.monthly_clicks as number) || 0,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error('List URLs error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

