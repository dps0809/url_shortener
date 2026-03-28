import { PoolClient } from 'pg';

// ─── Upsert ───

export async function upsertLinkHealth(
  client: PoolClient,
  urlId: number,
  statusCode: number,
  isDead: boolean
) {
  await client.query(
    `INSERT INTO link_health (url_id, last_status_code, failure_count, last_checked_at, is_dead)
     VALUES ($1, $2, $3, (NOW() AT TIME ZONE 'UTC'), $4)
     ON CONFLICT (url_id)
     DO UPDATE SET
       last_status_code = $2,
       failure_count = CASE
         WHEN $4 THEN link_health.failure_count + 1
         ELSE 0
       END,
       last_checked_at = (NOW() AT TIME ZONE 'UTC'),
       is_dead = $4`,
    [urlId, statusCode, isDead ? 1 : 0, isDead]
  );
}

/**
 * Record a network-level failure (timeout, DNS, etc.)
 * where no HTTP status code is available.
 */
export async function recordHealthFailure(client: PoolClient, urlId: number) {
  await client.query(
    `INSERT INTO link_health (url_id, last_status_code, failure_count, last_checked_at, is_dead)
     VALUES ($1, 0, 1, (NOW() AT TIME ZONE 'UTC'), false)
     ON CONFLICT (url_id)
     DO UPDATE SET
       last_status_code = 0,
       failure_count = link_health.failure_count + 1,
       last_checked_at = (NOW() AT TIME ZONE 'UTC'),
       is_dead = CASE
         WHEN link_health.failure_count + 1 >= 3 THEN true
         ELSE false
       END`,
    [urlId]
  );
}

// ─── Read ───

export async function getHealthByUrlId(client: PoolClient, urlId: number) {
  const { rows } = await client.query(
    `SELECT health_id, url_id, last_status_code, failure_count,
            last_checked_at, is_dead
     FROM link_health
     WHERE url_id = $1`,
    [urlId]
  );
  return rows[0] || null;
}

// ─── Create initial record ───

export async function initLinkHealth(client: PoolClient, urlId: number) {
  await client.query(
    `INSERT INTO link_health (url_id)
     VALUES ($1)
     ON CONFLICT (url_id) DO NOTHING`,
    [urlId]
  );
}
