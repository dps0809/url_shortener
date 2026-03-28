import { query } from '../utils/db';

export interface LinkHealthRecord {
  id: number;
  url_id: number;
  last_status_code: number | null;
  is_dead: boolean;
  last_checked_at: Date;
}

export const getActiveUrlsForHealthCheck = async (): Promise<{ id: number; long_url: string }[]> => {
  const result = await query<{ id: number; long_url: string }>(
    `SELECT id, long_url FROM urls WHERE status = 'active'`
  );
  return result.rows;
};

export const updateLinkHealth = async (urlId: number, lastStatusCode: number | null, isDead: boolean): Promise<void> => {
  await query(
    `UPDATE link_health
     SET last_status_code = $1,
         is_dead = $2,
         last_checked_at = NOW()
     WHERE url_id = $3`,
    [lastStatusCode, isDead, urlId]
  );
};

export const markUrlDead = async (urlId: number): Promise<void> => {
  await query(
    `UPDATE urls SET status = 'dead' WHERE id = $1`,
    [urlId]
  );
};
