import { NextRequest } from 'next/server';
import pool from '@/backend/src/utils/db';
import { requireAdmin } from '@/backend/src/utils/auth';
import { delCache } from '@/backend/src/utils/redis';
import { getUrlById, updateUrlStatus, softDeleteUrl } from '@/backend/src/utils/queries/urls';
import { insertAuditLog } from '@/backend/src/utils/queries/audit';

/**
 * PATCH /api/admin/urls/[id] — Admin: disable/delete/update a URL status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const urlId = parseInt(id, 10);

    if (isNaN(urlId)) {
      return Response.json({ error: 'Invalid URL ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, action } = body;

    // Validate status
    const validStatuses = ['active', 'disabled', 'malicious', 'expired', 'dead'];
    if (status && !validStatuses.includes(status)) {
      return Response.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get the URL (getUrlById filters is_deleted=false, but admin may
    // need to see deleted — use direct query for full check)
    const { rows } = await client.query(
      'SELECT url_id, short_code, status as current_status FROM urls WHERE url_id = $1',
      [urlId]
    );

    if (rows.length === 0) {
      return Response.json({ error: 'URL not found' }, { status: 404 });
    }

    const url = rows[0];

    // Update status
    if (status) {
      await updateUrlStatus(client, urlId, status);
    }

    // Handle soft delete action
    if (action === 'delete') {
      await softDeleteUrl(client, urlId);
    }

    // Log audit action
    const auditAction = action === 'delete'
      ? 'deleted_url'
      : status
        ? `changed_status_to_${status}`
        : 'updated_url';

    await insertAuditLog(client, admin.userId, auditAction, urlId);

    // Invalidate Redis cache
    await delCache(url.short_code);

    return Response.json({
      message: 'URL updated successfully',
      url: {
        urlId,
        shortCode: url.short_code,
        previousStatus: url.current_status,
        newStatus: status || (action === 'delete' ? 'disabled' : url.current_status),
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error('Admin update URL error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
