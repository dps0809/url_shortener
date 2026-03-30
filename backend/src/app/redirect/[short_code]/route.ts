import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache, incrCounter } from '../../../utils/redis';
import { checkRedirectLimit } from '../../../services/rateLimit.service';
import pool from '../../../utils/db'; // Direct query just like the snippet

export async function GET(
  request: NextRequest,
  { params }: { params: { short_code: string } }
) {
  const code = params.short_code;

  if (!code) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }

  // Rate Limiting Concept from previous setup
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  try {
    const isAllowed = await checkRedirectLimit(ipAddress);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
  } catch (error) {
    console.warn('Rate limiting failed, proceeding anyway:', error);
  }

  const cacheKey = `short:${code}`;

  try {
    // 1. Check Redis Cache
    const cachedUrl = await getCache(cacheKey);

    if (cachedUrl) {
      // 5. Click Counter on Hit
      await incrCounter(`clicks:${code}`);
      return NextResponse.redirect(new URL(cachedUrl));
    }

    // 2. Cache MISS -> Query DB (PostgreSQL)
    // Merged concept: Using the actual DB schema column names (long_url, expiry_date, is_deleted)
    const result = await pool.query(
      `SELECT id, long_url as "originalUrl", status, expiry_date as "expiresAt", is_deleted FROM urls WHERE short_code = $1 LIMIT 1`,
      [code]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    const urlRecord = result.rows[0];

    // Respecting soft delete as well!
    if (urlRecord.is_deleted) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    if (urlRecord.status === 'disabled' || urlRecord.status === 'malicious' || urlRecord.status === 'dead') {
      return NextResponse.json({ error: 'URL is deactivated or dangerous' }, { status: 410 });
    }

    const now = new Date();
    if (urlRecord.expiresAt && new Date(urlRecord.expiresAt) < now) {
      return NextResponse.json({ error: 'URL has expired' }, { status: 410 });
    }

    // 3. Cache HIT prepare - Calculate TTL
    let ttl: number | undefined;
    if (urlRecord.expiresAt) {
      const msDiff = new Date(urlRecord.expiresAt).getTime() - now.getTime();
      ttl = Math.max(1, Math.floor(msDiff / 1000));
    }

    // Store in Redis (we use utils/redis setCache directly)
    await setCache(cacheKey, urlRecord.originalUrl, ttl);

    // 5. Click Counter
    await incrCounter(`clicks:${code}`);

    // 4. Return Redirect
    return NextResponse.redirect(new URL(urlRecord.originalUrl));
  } catch (error) {
    console.error('Redirect Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
