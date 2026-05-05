import { NextRequest } from 'next/server';
import pool from '@/backend/src/utils/db';
import { requireAuth } from '@/backend/src/utils/auth';
import { createShortUrl } from '@/backend/src/services/url.service';
import { checkAndIncrementUsage } from '@/backend/src/utils/queries/usage';
import { listUrlsByUser } from '@/backend/src/utils/queries/urls';
import { validateCreateUrl } from '@/backend/src/validators/url.validator';
import { redis } from '@/backend/src/utils/redis';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * POST /api/urls — Create a short URL
 */
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    // 1. Authenticate
    const user = await requireAuth(request);

    // 2. IP-based Rate Limiting (10/hr)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = `ratelimit:auth:shorten:${ip}`;
    const PUBLIC_RATE_LIMIT = 10;
    const WINDOW_SECONDS = 3600;

    const currentUsage = await redis.get(rateLimitKey);
    const usageCount = currentUsage ? parseInt(currentUsage, 10) : 0;

    if (usageCount >= PUBLIC_RATE_LIMIT) {
      return Response.json(
        { error: 'IP Rate limit exceeded. Max 10 shortens per hour.' },
        { status: 429 }
      );
    }

    // 3. Check User-based Daily Rate limit
    const rateLimit = await checkAndIncrementUsage(client, user.userId);
    if (!rateLimit.allowed) {
      return Response.json(
        { error: 'Daily rate limit exceeded. Max requests per day.', remaining: 0 },
        { status: 429 }
      );
    }

    // Increment IP rate limit
    if (usageCount === 0) {
      await redis.set(rateLimitKey, 1, 'EX', WINDOW_SECONDS);
    } else {
      await redis.incr(rateLimitKey);
    }

    const body = await request.json();
    console.log('Final Test POST Body:', body);



    const validationError = validateCreateUrl(body);
    if (validationError) return validationError;

    const { long_url: longUrl, expiry_date: expiryDate, custom_alias: customAlias } = body;

    const expiry = expiryDate ? new Date(expiryDate) : undefined;
    const url = await createShortUrl(longUrl, user.userId, customAlias, expiry);
    const shortUrl = `${BASE_URL}/${url.short_code}`;

    return Response.json(
      {
        message: 'Short URL created',
        url_id: url.url_id,
        short_code: url.short_code,
        short_url: shortUrl,
        long_url: url.long_url,
        created_at: url.created_at,
        expires_at: url.expiry_date,
        status: url.status,
        safety_status: 'safe',
        rate_limit: {
          remaining: rateLimit.remaining,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof Error) {
      if (error.message === 'Rate limit exceeded') {
        return Response.json(
          { error: 'Rate limit exceeded. Max URLs limit reached.', remaining: 0 },
          { status: 429 }
        );
      }
      if (error.message === 'Alias already in use') {
        return Response.json(
          { error: 'Alias already in use' },
          { status: 400 }
        );
      }
      if (error.message.startsWith('URL blocked')) {
        return Response.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    console.error('Create URL error:', error);
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
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

    const urlsMapped = urls.map((u: Record<string, unknown>) => ({
      id: u.url_id,
      short_code: u.short_code,
      short_url: `${BASE_URL}/${u.short_code}`,
      long_url: u.long_url,
      created_at: u.created_at,
      expires_at: u.expiry_date,
      max_clicks: u.max_clicks,
      click_count: u.click_count,
      status: u.status,
      qr_code_url: u.qr_image_url,
      stats: {
        daily_clicks: (u.daily_clicks as number) || 0,
        weekly_clicks: (u.weekly_clicks as number) || 0,
        monthly_clicks: (u.monthly_clicks as number) || 0,
      },
    }));

    return Response.json({
      links: urlsMapped,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('List URLs error:', error);
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

