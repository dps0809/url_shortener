import { NextRequest } from 'next/server';
import pool from '@/backend/src/utils/db';
import { requireAuth } from '@/backend/src/utils/auth';
import { createShortUrl } from '@/backend/src/services/url.service';
import { checkAndIncrementUsage } from '@/backend/src/utils/queries/usage';
import { redis } from '@/backend/src/utils/redis';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * POST /api/urls/bulk — Bulk create short URLs
 */
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    // 1. Authenticate
    const user = await requireAuth(request);

    // 2. IP-based Rate Limiting (Bulk counts as multiple operations potentially, but we'll limit the REQUEST itself)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = `ratelimit:auth:bulk:${ip}`;
    const BULK_RATE_LIMIT = 5; // Allow fewer bulk requests per hour
    const WINDOW_SECONDS = 3600;

    const currentUsage = await redis.get(rateLimitKey);
    const usageCount = currentUsage ? parseInt(currentUsage, 10) : 0;

    if (usageCount >= BULK_RATE_LIMIT) {
      return Response.json(
        { error: 'Bulk rate limit exceeded. Max 5 bulk operations per hour.' },
        { status: 429 }
      );
    }

    const { urls } = await request.json();
    if (!urls || !Array.isArray(urls)) {
      return Response.json({ error: 'Invalid payload: urls array required' }, { status: 400 });
    }

    if (urls.length > 20) {
      return Response.json({ error: 'Max 20 URLs per bulk request' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    // 3. Process URLs sequentially to respect daily limits properly
    for (const item of urls) {
      try {
        // Check daily limit for each
        const rateLimit = await checkAndIncrementUsage(client, user.userId);
        if (!rateLimit.allowed) {
          errors.push({ long_url: item.long_url, error: 'Daily limit exceeded' });
          continue;
        }

        const url = await createShortUrl(item.long_url, user.userId, item.custom_alias);
        results.push({
          url_id: url.url_id,
          short_code: url.short_code,
          short_url: `${BASE_URL}/${url.short_code}`,
          long_url: url.long_url,
          created_at: url.created_at,
        });
      } catch (err: any) {
        errors.push({ long_url: item.long_url, error: err.message });
      }
    }

    // Increment bulk rate limit
    if (usageCount === 0) {
      await redis.set(rateLimitKey, 1, 'EX', WINDOW_SECONDS);
    } else {
      await redis.incr(rateLimitKey);
    }

    return Response.json({
      message: 'Bulk processing completed',
      processed_count: results.length,
      failed_count: errors.length,
      results,
      errors
    });

  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return Response.json({ error: 'Login required for bulk operations' }, { status: 401 });
    }
    console.error('Bulk creation error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
