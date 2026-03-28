import { PoolClient } from 'pg';

// ─── Create ───

export async function createUser(
  client: PoolClient,
  email: string,
  passwordHash: string,
  role: string = 'user'
) {
  const { rows } = await client.query(
    `INSERT INTO users (email, password_h, role)
     VALUES ($1, $2, $3)
     RETURNING user_id, email, role, is_active, created_at`,
    [email, passwordHash, role]
  );
  return rows[0] || null;
}

// ─── Read ───

export async function getUserByEmail(client: PoolClient, email: string) {
  const { rows } = await client.query(
    `SELECT user_id, email, password_h, role, is_active, created_at
     FROM users
     WHERE email = $1 AND is_active = true`,
    [email]
  );
  return rows[0] || null;
}

export async function getUserById(client: PoolClient, userId: number) {
  const { rows } = await client.query(
    `SELECT user_id, email, role, is_active, created_at
     FROM users
     WHERE user_id = $1 AND is_active = true`,
    [userId]
  );
  return rows[0] || null;
}

export async function checkEmailExists(client: PoolClient, email: string) {
  const { rows } = await client.query(
    'SELECT 1 FROM users WHERE email = $1',
    [email]
  );
  return rows.length > 0;
}

// ─── Update ───

export async function deactivateUser(client: PoolClient, userId: number) {
  const { rowCount } = await client.query(
    'UPDATE users SET is_active = false WHERE user_id = $1',
    [userId]
  );
  return (rowCount ?? 0) > 0;
}

// ─── List (admin) ───

export async function listUsers(
  client: PoolClient,
  limit: number = 20,
  offset: number = 0
) {
  const countResult = await client.query('SELECT COUNT(*) as total FROM users');
  const total = parseInt(countResult.rows[0].total, 10);

  const { rows } = await client.query(
    `SELECT user_id, email, role, is_active, created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return { rows, total };
}
