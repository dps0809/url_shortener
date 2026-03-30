import { disableUser } from '../models/user.model';
import { insertSafetyScanResult, markUrlAsMalicious } from '../models/safetyScan.model';
import { scanUrl as providerScanUrl, ScanResult } from '../utils/safety';
import { insertAuditLog } from '../utils/queries/audit';
import pool from '../utils/db';

export interface UrlScanOutcome {
  result: ScanResult;
  provider: string;
}

export const scanUrl = async (longUrl: string): Promise<UrlScanOutcome> => {
  return await providerScanUrl(longUrl);
};

export const storeScanResult = async (urlId: number, result: string, provider: string) => {
  await insertSafetyScanResult(urlId, result, provider);
};

export const markMaliciousUrl = async (urlId: number) => {
  await markUrlAsMalicious(urlId);
};

export const banUserForPhishing = async (userId: number) => {
  await disableUser(userId);
  const client = await pool.connect();
  try {
    await insertAuditLog(client, userId, 'USER_BANNED_FOR_PHISHING', null);
  } finally {
    client.release();
  }
};
