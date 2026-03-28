import { PoolClient } from 'pg';

// ─── Create / Init ───

export async function initUrlStats(client: PoolClient, urlId: number) {
  await client.query(
    `INSERT INTO url_stats (url_id)
     VALUES ($1)
     ON CONFLICT (url_id) DO NOTHING`,
    [urlId]
  );
}

// ─── Read ───

export async function getStatsByUrlId(client: PoolClient, urlId: number) {
  const { rows } = await client.query(
    `SELECT url_id, daily_clicks, weekly_clicks, monthly_clicks, last_updated
     FROM url_stats
     WHERE url_id = $1`,
    [urlId]
  );
  return rows[0] || null;
}

// ─── Update (called by background worker) ───

export async function updateUrlStats(
  client: PoolClient,
  urlId: number,
  dailyClicks: number,
  weeklyClicks: number,
  monthlyClicks: number
) {
  await client.query(
    `UPDATE url_stats
     SET daily_clicks = $1,
         weekly_clicks = $2,
         monthly_clicks = $3,
         last_updated = (NOW() AT TIME ZONE 'UTC')
     WHERE url_id = $4`,
    [dailyClicks, weeklyClicks, monthlyClicks, urlId]
  );
}
