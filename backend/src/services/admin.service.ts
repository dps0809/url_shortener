import { query } from '../utils/db';
import { disableUser } from '../models/user.model';
import { disableUrl } from '../models/url.model';
import { deleteUrlCache } from './cache.service';

export const getAllUsers = async (limit: number = 50, offset: number = 0) => {
  const result = await query(`SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
  return result.rows;
};

export const getAllUrls = async (limit: number = 50, offset: number = 0) => {
  const result = await query(`SELECT * FROM urls ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
  return result.rows;
};

export const blockUser = async (userId: number) => {
  await disableUser(userId);
  await query(`INSERT INTO audit_logs (action, target_id, type) VALUES ('block_user', $1, 'user')`, [userId]);
};

export const blockUrl = async (urlId: number, shortCode: string) => {
  await disableUrl(urlId);
  await deleteUrlCache(shortCode);
  await query(`INSERT INTO audit_logs (action, target_id, type) VALUES ('block_url', $1, 'url')`, [urlId]);
};

export const getAuditLogs = async (limit: number = 50, offset: number = 0) => {
  const result = await query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
  return result.rows;
};
