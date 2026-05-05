import { NextRequest } from 'next/server';
import pool from '@/backend/src/utils/db';
import { requireAuth } from '@/backend/src/utils/auth';
import { delCache } from '@/backend/src/utils/redis';
import { getUrlById, softDeleteUrl, updateUrlStatus } from '@/backend/src/utils/queries/urls';
import { disableUrl, enableUrl } from '@/backend/src/services/url.service';

/**
 * GET /api/urls/[id] — Get details for a specific URL (user must own it)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const urlId = parseInt(id, 10);

    if (isNaN(urlId)) {
      return Response.json({ error: 'Invalid URL ID' }, { status: 400 });
    }

    // Fetch URL details from database (including stats and QR via getUrlById extended logic if needed, or separate lookups)
    const url = await getUrlById(client, urlId);

    if (!url || url.user_id !== user.userId) {
      return Response.json({ error: 'URL not found or unauthorized' }, { status: 404 });
    }

    // Success response formatted for LinkDetailsPage
    return Response.json({
      id: url.url_id,
      shortCode: url.short_code,
      short: `shrt.li/${url.short_code}`,
      original: url.long_url,
      clicks: url.click_count || 0,
      createdAt: url.created_at,
      status: url.status,
      // Defaulting mock stats for now as per design, but could be dynamic
      referrers: [
        { source: 'Direct / Email', count: '452', percent: 38 },
        { source: 'Twitter / X', count: '312', percent: 26 },
        { source: 'LinkedIn', count: '224', percent: 18 },
        { source: 'Instagram Stories', count: '102', percent: 9 },
        { source: 'Other Sources', count: '114', percent: 9 },
      ],
      timeline: [
        { day: 'Mon', count: 120 }, { day: 'Tue', count: 210 }, { day: 'Wed', count: 180 },
        { day: 'Thu', count: 420 }, { day: 'Fri', count: 290 }, { day: 'Sat', count: 320 },
        { day: 'Sun', count: 150 },
      ]
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Fetch URL Detail error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/urls/[id] — Soft delete a URL (user must own it)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const urlId = parseInt(id, 10);

    if (isNaN(urlId)) {
      return Response.json({ error: 'Invalid URL ID' }, { status: 400 });
    }

    // Verify ownership
    const url = await getUrlById(client, urlId);

    if (!url || url.user_id !== user.userId) {
      return Response.json({ error: 'URL not found' }, { status: 404 });
    }

    // Soft delete
    await softDeleteUrl(client, urlId);

    // Invalidate Redis cache
    await delCache(url.short_code);

    return Response.json({ message: 'URL deleted successfully' });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Delete URL error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

