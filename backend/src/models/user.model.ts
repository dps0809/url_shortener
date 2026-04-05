import { query } from '../utils/db';

export interface UserRecord {
  id: number;
  user_id: number;
  email: string;
  password_h: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const createUser = async (email: string, passwordHash: string): Promise<UserRecord | null> => {
  const result = await query<UserRecord>(
    `INSERT INTO users (email, password_h)
     VALUES ($1, $2)
     RETURNING *`,
    [email, passwordHash]
  );
  return result.rows[0] || null;
};

export const findUserByEmail = async (email: string): Promise<UserRecord | null> => {
  const result = await query<UserRecord>(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
};

export const getUserById = async (id: number): Promise<UserRecord | null> => {
  const result = await query<UserRecord>(
    `SELECT * FROM users WHERE user_id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const disableUser = async (id: number): Promise<void> => {
  await query(
    `UPDATE users SET is_active = false WHERE user_id = $1`,
    [id]
  );
};
