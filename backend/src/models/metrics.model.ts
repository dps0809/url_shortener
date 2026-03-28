import { query } from '../utils/db';

export const getTotalUrlsCount = async (): Promise<number> => {
  const result = await query<{ count: string }>(`SELECT COUNT(*) FROM urls`);
  return parseInt(result.rows[0]?.count || '0', 10);
};

export const getTotalClicksCount = async (): Promise<number> => {
  const result = await query<{ count: string }>(`SELECT COUNT(*) FROM click_logs`);
  return parseInt(result.rows[0]?.count || '0', 10);
};

export const getTotalUsersCount = async (): Promise<number> => {
  const result = await query<{ count: string }>(`SELECT COUNT(*) FROM users`);
  return parseInt(result.rows[0]?.count || '0', 10);
};
