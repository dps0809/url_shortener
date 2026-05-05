import { PoolClient } from 'pg';

// ─── Create ───

export async function createSession(
  client: PoolClient,
  userId: number,
  expiresAt: string,
  ipAddress: string | null
) {
  const { rows } = await client.query(
    `INSERT INTO user_sessions (user_id, expires_at, ip_address)
     VALUES ($1, $2, $3)
     RETURNING session_id, created_at`,
    [userId, expiresAt, ipAddress]
  );
  return rows[0] || null;
}

// ─── Read ───

export async function getSessionWithUser(
  client: PoolClient,
  sessionId: string,
  userId: number
) {
  const { rows } = await client.query(
    `SELECT s.session_id, s.expires_at, s.created_at,
            u.id, u.email, u.role, u.is_active
     FROM user_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.session_id = $1 AND s.user_id = $2`,
    [sessionId, userId]
  );
  return rows[0] || null;
}

// ─── Delete ───

export async function deleteSession(
  client: PoolClient,
  sessionId: string,
  userId: number
) {
  const { rowCount } = await client.query(
    'DELETE FROM user_sessions WHERE session_id = $1 AND user_id = $2',
    [sessionId, userId]
  );
  return (rowCount ?? 0) > 0;
}

// ─── Cleanup expired sessions ───

export async function deleteExpiredSessions(client: PoolClient) {
  const { rowCount } = await client.query(
    `DELETE FROM user_sessions WHERE expires_at < (NOW() AT TIME ZONE 'UTC')`
  );
  return rowCount ?? 0;
}
