import { NextRequest } from 'next/server';
import pool from '@/backend/src/utils/db';
import { requireAuth } from '@/backend/src/utils/auth';
import { createShortUrl } from '@/backend/src/services/url.service';
import { checkAndIncrementUsage } from '@/backend/src/utils/queries/usage';
import { listUrlsByUser } from '@/backend/src/utils/queries/urls';
import { validateCreateUrl } from '@/backend/src/validators/url.validator';

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
    const validationError = validateCreateUrl(body);
    if (validationError) return validationError;

    const { long_url: longUrl, expiry_date: expiryDate, custom_alias: customAlias } = body;

    const expiry = expiryDate ? new Date(expiryDate) : undefined;
    const url = await createShortUrl(longUrl, user.userId, customAlias, expiry);
    const shortUrl = `${BASE_URL}/${url.short_code}`;

    return Response.json(
      {
        message: 'Short URL created',
        url: {
          id: url.id,
          short_code: url.short_code,
          short_url: shortUrl,
          long_url: url.long_url,
          created_at: url.created_at,
          expires_at: url.expiry_date,
          status: url.status,
          safety_status: 'safe',
        },
        rateLimit: {
          remaining: rateLimit.remaining,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Response) return error;
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

    return Response.json({
      urls: urls.map((u: Record<string, unknown>) => ({
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
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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

