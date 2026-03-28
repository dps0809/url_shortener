import { NextRequest } from 'next/server';
import pool from '@/backend/src/utils/db';
import { getCache, setCache } from '@/backend/src/utils/redis';
import { redirect } from 'next/navigation';
import UAParser from 'ua-parser-js';
import { getUrlForRedirect, incrementClickCount, updateUrlStatus } from '@/backend/src/utils/queries/urls';
import { insertClick } from '@/backend/src/utils/queries/clicks';

/**
 * GET /[code] — Redirect short link to original URL.
 * Flow: Redis cache → DB lookup → validate → log click → redirect
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // 1. Check Redis cache
    const cachedUrl = await getCache(code);

    if (cachedUrl) {
      // Log click asynchronously (don't block redirect)
      logClick(request, code).catch(console.error);
      return redirect(cachedUrl);
    }

    // 2. Cache miss — query database
    const client = await pool.connect();
    try {
      const url = await getUrlForRedirect(client, code);

      if (!url) {
        return new Response(null, {
          status: 302,
          headers: { Location: '/not-found' },
        });
      }

      // 3. Validate link status
      if (url.is_deleted || url.status !== 'active') {
        return new Response(null, {
          status: 302,
          headers: { Location: '/link-expired' },
        });
      }

      // Check expiry
      if (url.expiry_date && new Date(url.expiry_date) < new Date()) {
        await updateUrlStatus(client, url.url_id, 'expired');
        return new Response(null, {
          status: 302,
          headers: { Location: '/link-expired' },
        });
      }

      // Check max clicks
      if (url.max_clicks && url.click_count >= url.max_clicks) {
        await updateUrlStatus(client, url.url_id, 'expired');
        return new Response(null, {
          status: 302,
          headers: { Location: '/link-expired' },
        });
      }

      // 4. Cache in Redis
      await setCache(code, url.long_url);

      // 5. Log click + increment count (async to not block redirect)
      logClick(request, code).catch(console.error);

      // 6. Redirect
      return redirect(url.long_url);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Redirect error:', error);
    return new Response(null, {
      status: 302,
      headers: { Location: '/' },
    });
  }
}

/**
 * Log a click event — runs async to not block the redirect.
 * Acquires its own client from pool.
 */
async function logClick(request: NextRequest, shortCode: string) {
  const client = await pool.connect();
  try {
    // Get URL ID
    const url = await getUrlForRedirect(client, shortCode);
    if (!url) return;

    // Parse user agent
    const userAgent = request.headers.get('user-agent') || '';
    const parser = new (UAParser as any)(userAgent);
    const deviceType = parser.getDevice().type;
    const device = deviceType === 'mobile' || deviceType === 'tablet' ? 'mobile' : 'desktop';

    // Get IP and referrer
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const referrer = request.headers.get('referer') || null;

    // Geo lookup placeholder — country is null for now
    const country: string | null = null;

    // Insert click log
    await insertClick(client, url.url_id, ip, country, device, referrer);

    // Increment click count
    await incrementClickCount(client, url.url_id);
  } catch (error) {
    console.error('Click logging error:', error);
  } finally {
    client.release();
  }
}
