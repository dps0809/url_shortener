import { query } from '../utils/db'; 

export const getDailyAnalytics = async (urlId: number, startDate: Date, endDate: Date) => {
  const result = await query(
    `SELECT DATE(clicked_at) as date, COUNT(*) as clicks FROM click_logs WHERE url_id = $1 AND clicked_at BETWEEN $2 AND $3 GROUP BY DATE(clicked_at)`,
    [urlId, startDate, endDate]
  );
  return result.rows;
};

export const getCountryAnalytics = async (urlId: number) => {
  const result = await query(
    `SELECT country, COUNT(*) as clicks FROM click_logs WHERE url_id = $1 GROUP BY country`,
    [urlId]
  );
  return result.rows;
};

export const getDeviceAnalytics = async (urlId: number) => {
  const result = await query(
    `SELECT device as device_type, COUNT(*) as clicks FROM click_logs WHERE url_id = $1 GROUP BY device`,
    [urlId]
  );
  return result.rows;
};

export const getTotalClicks = async (urlId: number) => {
  const result = await query(
    `SELECT COUNT(*) as total_clicks FROM click_logs WHERE url_id = $1`,
    [urlId]
  );
  return result.rows[0]?.total_clicks || 0;
};
