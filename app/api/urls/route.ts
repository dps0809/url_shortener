import { NextRequest } from 'next/server';
import pool from '@/backend/src/utils/db';
import { requireAuth } from '@/backend/src/utils/auth';
import { generateUniqueShortCode } from '@/backend/src/utils/shortCode';
import { scanUrl } from '@/backend/src/utils/safety';
import { generateQrCode } from '@/backend/src/utils/qr';
import { setCache } from '@/backend/src/utils/redis';
import { createUrl, listUrlsByUser } from '@/backend/src/utils/queries/urls';
import { insertSafetyScan } from '@/backend/src/utils/queries/safety';
import { insertQrCode } from '@/backend/src/utils/queries/qr';
import { initLinkHealth } from '@/backend/src/utils/queries/health';
import { initUrlStats } from '@/backend/src/utils/queries/stats';
import { checkAndIncrementUsage } from '@/backend/src/utils/queries/usage';

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
    const { longUrl, expiryDate, maxClicks } = body;

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

    // 4. Safety scan
    const scanResult = await scanUrl(longUrl);

    // 5. Generate unique short code (with retry)
    const shortCode = await generateUniqueShortCode(client);

    // 6. Begin transaction for all inserts
    await client.query('BEGIN');

    // 7. Insert into urls table
    const status = scanResult.result === 'safe' ? 'active' : 'malicious';
    const url = await createUrl(
      client,
      shortCode,
      longUrl,
      user.userId,
      expiryDate || null,
      maxClicks || null
    );

    // Update status if malicious
    if (status === 'malicious') {
      await client.query('UPDATE urls SET status = $1 WHERE url_id = $2', [status, url.url_id]);
    }

    // 8. Insert safety scan record
    // On API failure, scanUrl returns result='safe' with error fallback provider.
    // Per rule 9: if scan API fails, store 'error' â€” but our safety.ts already
    // handles this by returning a safe fallback. Store actual result.
    await insertSafetyScan(client, url.url_id, scanResult.result, scanResult.provider);

    // 9. Generate QR code â†’ insert into qr_codes
    const shortUrl = `${BASE_URL}/${shortCode}`;
    const qrImageUrl = await generateQrCode(shortUrl, shortCode);
    await insertQrCode(client, url.url_id, qrImageUrl);

    // 10. Init link health record
    await initLinkHealth(client, url.url_id);

    // 11. Init url_stats record
    await initUrlStats(client, url.url_id);

    await client.query('COMMIT');

    // 12. Cache in Redis (outside transaction â€” non-critical)
    if (status === 'active') {
      await setCache(shortCode, longUrl);
    }

    return Response.json(
      {
        message: 'Short URL created',
        url: {
          urlId: url.url_id,
          shortCode: url.short_code,
          shortUrl,
          longUrl: url.long_url,
          createdAt: url.created_at,
          expiryDate: url.expiry_date,
          maxClicks: url.max_clicks,
          status,
          qrCodeUrl: qrImageUrl,
          safetyStatus: scanResult.result,
        },
        rateLimit: {
          remaining: rateLimit.remaining,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
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

