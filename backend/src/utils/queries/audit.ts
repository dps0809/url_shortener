import { PoolClient } from 'pg';

// ─── Create ───

export async function insertAuditLog(
  client: PoolClient,
  adminId: number,
  action: string,
  targetUrlId: number | null = null
) {
  const { rows } = await client.query(
    `INSERT INTO audit_logs (admin_id, action, target_url_id)
     VALUES ($1, $2, $3)
     RETURNING id, created_at`,
    [adminId, action, targetUrlId]
  );
  return rows[0] || null;
}

// ─── Read ───

export async function getAuditLogs(
  client: PoolClient,
  limit: number = 20,
  offset: number = 0
) {
  const countResult = await client.query(
    'SELECT COUNT(*) as total FROM audit_logs'
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const { rows } = await client.query(
    `SELECT a.id, a.action, a.target_url_id, a.created_at,
            u.email as admin_email
     FROM audit_logs a
     JOIN users u ON u.user_id = a.admin_id
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return { rows, total };
}

export async function getAuditLogsByAdmin(
  client: PoolClient,
  adminId: number,
  limit: number = 20,
  offset: number = 0
) {
  const countResult = await client.query(
    'SELECT COUNT(*) as total FROM audit_logs WHERE admin_id = $1',
    [adminId]
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const { rows } = await client.query(
    `SELECT id, action, target_url_id, created_at
     FROM audit_logs
     WHERE admin_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [adminId, limit, offset]
  );

  return { rows, total };
}
