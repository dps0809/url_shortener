import { query } from '../utils/db';

export interface ClickLogRecord {
  id: number;
  url_id: number;
  country: string | null;
  device: string | null;
  ip_address: string | null;
  clicked_at: Date;
}

export const insertClickLog = async (urlId: number, country: string | null, device: string | null, ipAddress: string | null): Promise<void> => {
  await query(
    `INSERT INTO click_logs (url_id, country, device, ip_address)
     VALUES ($1, $2, $3, $4)`,
    [urlId, country, device, ipAddress]
  );
};

export const getTotalClicks = async (urlId: number): Promise<number> => {
  const result = await query<{ click_count: number }>(
    `SELECT click_count FROM urls WHERE id = $1`,
    [urlId]
  );
  return result.rows[0]?.click_count || 0;
};

export const getDailyAnalytics = async (urlId: number): Promise<{ date: string; clicks: string }[]> => {
  const result = await query<{ date: string; clicks: string }>(
    `SELECT DATE(clicked_at) AS date, COUNT(*) AS clicks
     FROM click_logs
     WHERE url_id = $1
     GROUP BY DATE(clicked_at)
     ORDER BY date`,
    [urlId]
  );
  return result.rows;
};

export const getCountryAnalytics = async (urlId: number): Promise<{ country: string; clicks: string }[]> => {
  const result = await query<{ country: string; clicks: string }>(
    `SELECT country, COUNT(*) AS clicks
     FROM click_logs
     WHERE url_id = $1
     GROUP BY country
     ORDER BY clicks DESC`,
    [urlId]
  );
  return result.rows;
};

export const getDeviceAnalytics = async (urlId: number): Promise<{ device: string; clicks: string }[]> => {
  const result = await query<{ device: string; clicks: string }>(
    `SELECT device, COUNT(*) AS clicks
     FROM click_logs
     WHERE url_id = $1
     GROUP BY device
     ORDER BY clicks DESC`,
    [urlId]
  );
  return result.rows;
};
