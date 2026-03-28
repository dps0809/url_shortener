import { query } from '../utils/db';
import { disableUser } from '../models/user.model';

export const scanUrl = async (urlId: number, longUrl: string, userId: number) => {
  // Simulate external API scan
  const isMalicious = longUrl.includes('malware') || longUrl.includes('phishing');
  const scanResult = isMalicious ? 'malicious' : 'safe';
  
  await storeScanResult(urlId, scanResult);
  
  if (isMalicious) {
    await markMaliciousUrl(urlId);
    await banUserForPhishing(userId);
  }
  
  return scanResult;
};

export const storeScanResult = async (urlId: number, result: string) => {
  await query(`INSERT INTO scan_results (url_id, result) VALUES ($1, $2)`, [urlId, result]);
};

export const markMaliciousUrl = async (urlId: number) => {
  await query(`UPDATE urls SET status = 'malicious' WHERE id = $1`, [urlId]);
};

export const banUserForPhishing = async (userId: number) => {
  await disableUser(userId);
  await query(`UPDATE urls SET status = 'disabled' WHERE user_id = $1`, [userId]);
};
