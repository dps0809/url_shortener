import { PoolClient } from 'pg';

const MAX_REQUESTS_PER_DAY = 50;

// ─── Check & Increment ───

/**
 * Check if user is under the daily rate limit.
 * If allowed, increments the counter.
 * Resets counter when 24 hours have passed since last_request.
 *
 * Returns { allowed: boolean, remaining: number }.
 */
export async function checkAndIncrementUsage(
  client: PoolClient,
  userId: number
): Promise<{ allowed: boolean; remaining: number }> {
  const { rows } = await client.query(
    'SELECT id, request_count, last_request FROM api_usage WHERE user_id = $1',
    [userId]
  );

  const now = new Date().toISOString();

  if (rows.length === 0) {
    // First request ever — create record
    await client.query(
      `INSERT INTO api_usage (user_id, request_count, last_request)
       VALUES ($1, 1, $2)`,
      [userId, now]
    );
    return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - 1 };
  }

  const usage = rows[0];
  const lastRequest = new Date(usage.last_request);
  const nowDate = new Date(now);

  // Check if 24 hours have passed since last_request
  const hoursSince = (nowDate.getTime() - lastRequest.getTime()) / (1000 * 60 * 60);

  if (hoursSince >= 24) {
    // Reset counter
    await client.query(
      `UPDATE api_usage SET request_count = 1, last_request = $1 WHERE user_id = $2`,
      [now, userId]
    );
    return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - 1 };
  }

  // Same 24h window — check limit
  if (usage.request_count >= MAX_REQUESTS_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }

  // Increment
  await client.query(
    `UPDATE api_usage SET request_count = request_count + 1, last_request = $1 WHERE user_id = $2`,
    [now, userId]
  );

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_DAY - usage.request_count - 1,
  };
}

// ─── Read ───

export async function getUsage(client: PoolClient, userId: number) {
  const { rows } = await client.query(
    'SELECT id, user_id, request_count, last_request FROM api_usage WHERE user_id = $1',
    [userId]
  );
  return rows[0] || null;
}
