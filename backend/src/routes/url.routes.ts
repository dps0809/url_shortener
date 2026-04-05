import { NextRequest, NextResponse } from 'next/server';
import { 
  createShortUrl, 
  getUserUrls, 
  updateExpiry, 
  deleteUrl,
  checkAliasAvailability
} from '../services/url.service';
import { getUrlById, getUrlByShortCode } from '../models/url.model';
import { getCache, setCache, incrCounter, delCache } from '../utils/redis';
import { enqueueAnalyticsSync } from '../services/queue.service';
import { checkRedirectLimit } from '../services/rateLimit.service';

/**
 * 1. POST /urls - Create a new short link
 */
export async function createUrlHandler(req: NextRequest) {
  try {
    const { long_url, custom_alias, expiry_date } = await req.json();
    const userId = 1; // Mock user ID for now

    if (!long_url) {
      return NextResponse.json({ error: 'long_url is required' }, { status: 400 });
    }

    const urlRecord = await createShortUrl(
      long_url, 
      userId, 
      custom_alias, 
      expiry_date ? new Date(expiry_date) : undefined
    );

    return NextResponse.json({
      short_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${urlRecord.short_code}`,
      expires_at: urlRecord.expiry_date
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 2. GET /urls - Return all links for user
 */
export async function listUrlsHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;
  const userId = 1; // Mock user ID

  try {
    const urls = await getUserUrls(userId, limit, offset);
    return NextResponse.json(urls.map(u => ({
      id: u.id,
      short_code: u.short_code,
      long_url: u.long_url,
      click_count: u.click_count
    })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 3. GET /urls/:id - Fetch single link details
 */
export async function getUrlHandler(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  try {
    const url = await getUrlById(id);
    if (!url) return NextResponse.json({ error: 'URL not found' }, { status: 404 });

    return NextResponse.json({
      short_code: url.short_code,
      long_url: url.long_url,
      status: url.status,
      expiry_date: url.expiry_date
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 4. PATCH /urls/:id - Update link settings
 */
export async function updateUrlHandler(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  try {
    const { expiry_date } = await req.json();
    if (!expiry_date) return NextResponse.json({ error: 'expiry_date is required' }, { status: 400 });

    const updated = await updateExpiry(id, new Date(expiry_date));
    
    // Invalidate Redis cache
    if (updated) {
      await delCache(`short:${updated.short_code}`);
    }

    return NextResponse.json({ message: 'URL updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 5. DELETE /urls/:id - Soft delete a link
 */
export async function deleteUrlHandler(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  try {
    const url = await getUrlById(id);
    if (!url) return NextResponse.json({ error: 'URL not found' }, { status: 404 });

    await deleteUrl(id);
    await delCache(`short:${url.short_code}`);

    return NextResponse.json({ message: 'URL deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 6. GET /:short_code - Redirect to original URL
 */
export async function redirectHandler(req: NextRequest, { params }: { params: { short_code: string } }) {
  const code = params.short_code;
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || '';

  try {
    // Rate limit check
    const isAllowed = await checkRedirectLimit(ipAddress);
    if (!isAllowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const cacheKey = `short:${code}`;
    let longUrl = await getCache(cacheKey);

    if (!longUrl) {
      const urlRecord = await getUrlByShortCode(code);
      if (!urlRecord || urlRecord.is_deleted || urlRecord.status !== 'active') {
        return NextResponse.json({ error: 'URL not found or inactive' }, { status: 404 });
      }

      // Check expiry
      if (urlRecord.expiry_date && new Date(urlRecord.expiry_date) < new Date()) {
        return NextResponse.json({ error: 'URL has expired' }, { status: 410 });
      }

      longUrl = urlRecord.long_url;
      let ttl: number | undefined;
      if (urlRecord.expiry_date) {
        ttl = Math.max(1, Math.floor((new Date(urlRecord.expiry_date).getTime() - Date.now()) / 1000));
      }
      await setCache(cacheKey, longUrl, ttl);
    }

    // Increment click count (Redis counter)
    await incrCounter(`clicks:${code}`);

    // Offload analytics to worker
    await enqueueAnalyticsSync({
      shortCode: code,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });

    return NextResponse.redirect(longUrl);
  } catch (error: any) {
    console.error('Redirect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
