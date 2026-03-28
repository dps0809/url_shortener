import { query } from '../utils/db';

export interface SafetyScanRecord {
  id: number;
  url_id: number;
  scan_result: string;
  scan_provider: string;
  scanned_at: Date;
}

export const insertSafetyScanResult = async (urlId: number, scanResult: string, scanProvider: string): Promise<void> => {
  await query(
    `INSERT INTO safety_scan (url_id, scan_result, scan_provider)
     VALUES ($1, $2, $3)`,
    [urlId, scanResult, scanProvider]
  );
};

export const getScanHistory = async (urlId: number): Promise<SafetyScanRecord[]> => {
  const result = await query<SafetyScanRecord>(
    `SELECT * FROM safety_scan
     WHERE url_id = $1
     ORDER BY scanned_at DESC`,
    [urlId]
  );
  return result.rows;
};

export const markUrlAsMalicious = async (urlId: number): Promise<void> => {
  await query(
    `UPDATE urls SET status = 'malicious' WHERE id = $1`,
    [urlId]
  );
};
