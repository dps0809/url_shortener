import { query } from '../utils/db';

export interface UrlRecord {
  id: number;
  short_code: string;
  long_url: string;
  user_id: number;
  click_count: number;
  expiry_date: Date | null;
  status: 'active' | 'disabled' | 'expired' | 'malicious' | 'dead';
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export const createUrl = async (shortCode: string, longUrl: string, userId: number, expiryDate: Date | null): Promise<UrlRecord | null> => {
  const result = await query<UrlRecord>(
    `INSERT INTO urls (short_code, long_url, user_id, expiry_date, status)
     VALUES ($1, $2, $3, $4, 'active')
     RETURNING *`,
    [shortCode, longUrl, userId, expiryDate]
  );
  return result.rows[0] || null;
};

export const getUrlByShortCode = async (shortCode: string): Promise<UrlRecord | null> => {
  const result = await query<UrlRecord>(
    `SELECT * FROM urls
     WHERE short_code = $1 AND status = 'active' AND is_deleted = false`,
    [shortCode]
  );
  return result.rows[0] || null;
};

export const getUrlById = async (id: number): Promise<UrlRecord | null> => {
  const result = await query<UrlRecord>(
    `SELECT * FROM urls WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const getUrlsByUser = async (userId: number, limit: number = 10, offset: number = 0): Promise<UrlRecord[]> => {
  const result = await query<UrlRecord>(
    `SELECT * FROM urls
     WHERE user_id = $1 AND is_deleted = false
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
};

export const updateExpiryDate = async (id: number, expiryDate: Date): Promise<UrlRecord | null> => {
  const result = await query<UrlRecord>(
    `UPDATE urls
     SET expiry_date = $1
     WHERE id = $2
     RETURNING *`,
    [expiryDate, id]
  );
  return result.rows[0] || null;
};

export const disableUrl = async (id: number): Promise<void> => {
  await query(
    `UPDATE urls SET status = 'disabled' WHERE id = $1`,
    [id]
  );
};

export const enableUrl = async (id: number): Promise<void> => {
  await query(
    `UPDATE urls SET status = 'active' WHERE id = $1`,
    [id]
  );
};

export const softDeleteUrl = async (id: number): Promise<void> => {
  await query(
    `UPDATE urls SET is_deleted = true WHERE id = $1`,
    [id]
  );
};

export const incrementClickCount = async (shortCode: string, incrementBy: number = 1): Promise<void> => {
  await query(
    `UPDATE urls
     SET click_count = click_count + $1
     WHERE short_code = $2`,
    [incrementBy, shortCode]
  );
};

export const getExpiredUrls = async (): Promise<{ id: number }[]> => {
  const result = await query<{ id: number }>(
    `SELECT id FROM urls
     WHERE expiry_date < NOW() AND status = 'active'`
  );
  return result.rows;
};

export const markUrlExpired = async (id: number): Promise<void> => {
  await query(
    `UPDATE urls SET status = 'expired' WHERE id = $1`,
    [id]
  );
};

export const checkShortCodeExists = async (code: string): Promise<boolean> => {
  const result = await query<{ id: number }>(
    `SELECT id FROM urls WHERE short_code = $1 LIMIT 1`,
    [code]
  );
  return result.rowCount !== null && result.rowCount > 0;
};

export const checkUrlOwnership = async (id: number, userId: number): Promise<boolean> => {
  const result = await query<{ id: number }>(
    `SELECT id FROM urls WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rowCount !== null && result.rowCount > 0;
};

export const getActiveUrls = async (limit: number = 1000, offset: number = 0): Promise<{ id: number; long_url: string }[]> => {
  const result = await query<{ id: number; long_url: string }>(
    `SELECT id, long_url FROM urls
     WHERE status = 'active'
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};
