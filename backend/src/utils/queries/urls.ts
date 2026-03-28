import { PoolClient } from 'pg';

// ─── Create ───

export async function createUrl(
  client: PoolClient,
  shortCode: string,
  longUrl: string,
  userId: number,
  expiryDate: string | null = null,
  maxClicks: number | null = null
) {
  const { rows } = await client.query(
    `INSERT INTO urls (short_code, long_url, user_id, expiry_date, max_clicks)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING url_id, short_code, long_url, user_id, created_at,
               expiry_date, max_clicks, click_count, status`,
    [shortCode, longUrl, userId, expiryDate, maxClicks]
  );
  return rows[0] || null;
}

// ─── Read ───

export async function getUrlByShortCode(client: PoolClient, shortCode: string) {
  const { rows } = await client.query(
    `SELECT url_id, short_code, long_url, user_id, created_at,
            expiry_date, max_clicks, click_count, status, is_deleted
     FROM urls
     WHERE short_code = $1 AND is_deleted = false`,
    [shortCode]
  );
  return rows[0] || null;
}

export async function getUrlById(client: PoolClient, urlId: number) {
  const { rows } = await client.query(
    `SELECT url_id, short_code, long_url, user_id, created_at,
            expiry_date, max_clicks, click_count, status, is_deleted
     FROM urls
     WHERE url_id = $1 AND is_deleted = false`,
    [urlId]
  );
  return rows[0] || null;
}

/**
 * Lookup by short code for redirect — includes deleted/inactive for
 * proper error messages.
 */
export async function getUrlForRedirect(client: PoolClient, shortCode: string) {
  const { rows } = await client.query(
    `SELECT url_id, short_code, long_url, expiry_date, max_clicks,
            click_count, status, is_deleted
     FROM urls
     WHERE short_code = $1`,
    [shortCode]
  );
  return rows[0] || null;
}

// ─── List ───

export async function listUrlsByUser(
  client: PoolClient,
  userId: number,
  limit: number = 20,
  offset: number = 0
) {
  const countResult = await client.query(
    'SELECT COUNT(*) as total FROM urls WHERE user_id = $1 AND is_deleted = false',
    [userId]
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const { rows } = await client.query(
    `SELECT u.url_id, u.short_code, u.long_url, u.created_at,
            u.expiry_date, u.max_clicks, u.click_count, u.status,
            q.qr_image_url,
            s.daily_clicks, s.weekly_clicks, s.monthly_clicks
     FROM urls u
     LEFT JOIN qr_codes q ON q.url_id = u.url_id
     LEFT JOIN url_stats s ON s.url_id = u.url_id
     WHERE u.user_id = $1 AND u.is_deleted = false
     ORDER BY u.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return { rows, total };
}

export async function listAllUrls(
  client: PoolClient,
  limit: number = 20,
  offset: number = 0,
  statusFilter: string | null = null
) {
  let whereClause = 'WHERE 1=1';
  const params: unknown[] = [];
  let idx = 1;

  if (statusFilter) {
    whereClause += ` AND u.status = $${idx}`;
    params.push(statusFilter);
    idx++;
  }

  const countResult = await client.query(
    `SELECT COUNT(*) as total FROM urls u ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const { rows } = await client.query(
    `SELECT u.url_id, u.short_code, u.long_url, u.created_at, u.click_count,
            u.status, u.is_deleted, u.expiry_date, u.max_clicks,
            us.email as user_email,
            h.is_dead, h.last_status_code,
            ss.scan_result
     FROM urls u
     LEFT JOIN users us ON us.user_id = u.user_id
     LEFT JOIN link_health h ON h.url_id = u.url_id
     LEFT JOIN (
       SELECT DISTINCT ON (url_id) url_id, scan_result
       FROM safety_scan
       ORDER BY url_id, scanned_at DESC
     ) ss ON ss.url_id = u.url_id
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );

  return { rows, total };
}

// ─── Update ───

export async function incrementClickCount(client: PoolClient, urlId: number) {
  await client.query(
    'UPDATE urls SET click_count = click_count + 1 WHERE url_id = $1',
    [urlId]
  );
}

export async function updateUrlStatus(
  client: PoolClient,
  urlId: number,
  status: string
) {
  const { rowCount } = await client.query(
    'UPDATE urls SET status = $1 WHERE url_id = $2',
    [status, urlId]
  );
  return (rowCount ?? 0) > 0;
}

// ─── Soft Delete ───

export async function softDeleteUrl(client: PoolClient, urlId: number) {
  await client.query(
    `UPDATE urls
     SET is_deleted = true,
         deleted_at = (NOW() AT TIME ZONE 'UTC'),
         status = 'disabled'
     WHERE url_id = $1`,
    [urlId]
  );
}

// ─── Short code collision check ───

export async function shortCodeExists(client: PoolClient, shortCode: string) {
  const { rows } = await client.query(
    'SELECT 1 FROM urls WHERE short_code = $1',
    [shortCode]
  );
  return rows.length > 0;
}

// ─── Active URLs for health check ───

export async function getActiveUrlsForHealthCheck(
  client: PoolClient,
  limit: number = 500
) {
  const { rows } = await client.query(
    `SELECT url_id, long_url, short_code
     FROM urls
     WHERE status = 'active' AND is_deleted = false
     LIMIT $1`,
    [limit]
  );
  return rows;
}
