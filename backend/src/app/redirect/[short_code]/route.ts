import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache, incrCounter } from '../../../utils/redis';
import pool from '../../../utils/db'; // Pure pg

export async function GET(
  request: NextRequest,
  { params }: { params: { short_code: string } }
) {
  const code = params.short_code;

  if (!code) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
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
    const result = await pool.query(
      `SELECT id, "originalUrl", status, "expiresAt" FROM urls WHERE "shortCode" = $1 LIMIT 1`,
      [code]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    const urlRecord = result.rows[0];

    if (urlRecord.status === 'DISABLED' || urlRecord.status === 'MALICIOUS') {
      return NextResponse.json({ error: 'URL is disabled' }, { status: 403 });
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

    // Store in Redis
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
