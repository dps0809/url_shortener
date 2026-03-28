import { PoolClient } from 'pg';

// ─── Create ───

export async function insertClick(
  client: PoolClient,
  urlId: number,
  ipAddress: string | null,
  country: string | null,
  device: string | null,
  referrer: string | null
) {
  const { rows } = await client.query(
    `INSERT INTO click_logs (url_id, ip_address, country, device, referrer)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING click_id`,
    [urlId, ipAddress, country, device, referrer]
  );
  return rows[0] || null;
}

// ─── Read ───

export async function getClicksByUrlId(
  client: PoolClient,
  urlId: number,
  limit: number = 20,
  offset: number = 0
) {
  const countResult = await client.query(
    'SELECT COUNT(*) as total FROM click_logs WHERE url_id = $1',
    [urlId]
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const { rows } = await client.query(
    `SELECT click_id, url_id, clicked_at, ip_address, country, device, referrer
     FROM click_logs
     WHERE url_id = $1
     ORDER BY clicked_at DESC
     LIMIT $2 OFFSET $3`,
    [urlId, limit, offset]
  );

  return { rows, total };
}

// ─── Aggregations for analytics ───

export async function getDailyBreakdown(
  client: PoolClient,
  urlId: number,
  days: number = 7
) {
  const { rows } = await client.query(
    `SELECT DATE(clicked_at) as date, COUNT(*) as clicks
     FROM click_logs
     WHERE url_id = $1
       AND clicked_at >= (NOW() AT TIME ZONE 'UTC') - CAST($2 || ' days' AS INTERVAL)
     GROUP BY DATE(clicked_at)
     ORDER BY date ASC`,
    [urlId, days]
  );
  return rows;
}

export async function getDeviceBreakdown(client: PoolClient, urlId: number) {
  const { rows } = await client.query(
    `SELECT device, COUNT(*) as count
     FROM click_logs
     WHERE url_id = $1
     GROUP BY device`,
    [urlId]
  );
  return rows;
}

export async function getCountryBreakdown(
  client: PoolClient,
  urlId: number,
  limit: number = 10
) {
  const { rows } = await client.query(
    `SELECT country, COUNT(*) as count
     FROM click_logs
     WHERE url_id = $1 AND country IS NOT NULL
     GROUP BY country
     ORDER BY count DESC
     LIMIT $2`,
    [urlId, limit]
  );
  return rows;
}

export async function getTopReferrers(
  client: PoolClient,
  urlId: number,
  limit: number = 10
) {
  const { rows } = await client.query(
    `SELECT referrer, COUNT(*) as count
     FROM click_logs
     WHERE url_id = $1 AND referrer IS NOT NULL
     GROUP BY referrer
     ORDER BY count DESC
     LIMIT $2`,
    [urlId, limit]
  );
  return rows;
}
