import { NextRequest } from 'next/server';
import pool from '@/backend/src/utils/db';
import { requireAdmin } from '@/backend/src/utils/auth';
import { listAllUrls } from '@/backend/src/utils/queries/urls';

/**
 * GET /api/admin/urls â€” List all URLs (admin only, paginated)
 */
export async function GET(request: NextRequest) {
  const client = await pool.connect();
  try {
    await requireAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;
    const statusFilter = searchParams.get('status') || null;

    const { rows: urls, total } = await listAllUrls(client, limit, offset, statusFilter);

    return Response.json({
      urls: urls.map((u: Record<string, unknown>) => ({
        urlId: u.url_id,
        shortCode: u.short_code,
        longUrl: u.long_url,
        createdAt: u.created_at,
        clickCount: u.click_count,
        status: u.status,
        isDeleted: u.is_deleted,
        expiryDate: u.expiry_date,
        maxClicks: u.max_clicks,
        userEmail: u.user_email,
        health: {
          isDead: (u.is_dead as boolean) || false,
          lastStatusCode: u.last_status_code,
        },
        safetyResult: u.scan_result,
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
    console.error('Admin list URLs error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

