import { PoolClient } from 'pg';

// ─── Create ───

export async function createUser(
  client: PoolClient,
  email: string,
  passwordHash: string,
  role: string = 'user'
) {
  const { rows } = await client.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id, email, role, is_active, created_at`,
    [email, passwordHash, role]
  );
  return rows[0] || null;
}

// ─── Read ───

export async function getUserByEmail(client: PoolClient, email: string) {
  const { rows } = await client.query(
    `SELECT id, email, password_hash, role, is_active, created_at
     FROM users
     WHERE email = $1 AND is_active = true`,
    [email]
  );
  return rows[0] || null;
}

export async function getUserById(client: PoolClient, id: number) {
  const { rows } = await client.query(
    `SELECT id, email, role, is_active, created_at
     FROM users
     WHERE id = $1 AND is_active = true`,
    [id]
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

export async function deactivateUser(client: PoolClient, id: number) {
  const { rowCount } = await client.query(
    'UPDATE users SET is_active = false WHERE id = $1',
    [id]
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
    `SELECT id, email, role, is_active, created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return { rows, total };
}
export async function updateUserRole(client: PoolClient, id: number, role: string) {
  const { rowCount } = await client.query(
    'UPDATE users SET role = $1 WHERE id = $2',
    [role, id]
  );
  return (rowCount ?? 0) > 0;
}
