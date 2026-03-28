import { query } from '../utils/db';
import { UserRecord } from './user.model';
import { UrlRecord } from './url.model';

export interface AuditLogRecord {
  id: number;
  admin_id: number;
  action: string;
  target_url_id: number | null;
  created_at: Date;
}

export const getAllUsers = async (): Promise<UserRecord[]> => {
  const result = await query<UserRecord>(
    `SELECT * FROM users ORDER BY created_at DESC`
  );
  return result.rows;
};

export const getAllUrls = async (): Promise<UrlRecord[]> => {
  const result = await query<UrlRecord>(
    `SELECT * FROM urls ORDER BY created_at DESC`
  );
  return result.rows;
};

export const insertAuditLog = async (adminId: number, action: string, targetUrlId: number | null = null): Promise<void> => {
  await query(
    `INSERT INTO audit_logs (admin_id, action, target_url_id)
     VALUES ($1, $2, $3)`,
    [adminId, action, targetUrlId]
  );
};

export const getAuditLogs = async (): Promise<AuditLogRecord[]> => {
  const result = await query<AuditLogRecord>(
    `SELECT * FROM audit_logs ORDER BY created_at DESC`
  );
  return result.rows;
};
