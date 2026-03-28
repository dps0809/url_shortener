import { NextRequest } from 'next/server';
import pool from '@/backend/src/utils/db';
import { requireAuth } from '@/backend/src/utils/auth';
import { delCache } from '@/backend/src/utils/redis';
import { getUrlById, softDeleteUrl } from '@/backend/src/utils/queries/urls';

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

    // Verify ownership (getUrlById already filters is_deleted = false)
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
    if (error instanceof Response) throw error;
    console.error('Delete URL error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
