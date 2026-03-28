import { query } from '../utils/db';

export interface QRCodeRecord {
  id: number;
  url_id: number;
  qr_image_url: string;
  generated_at: Date;
}

export const createQRCode = async (urlId: number, qrImageUrl: string): Promise<QRCodeRecord | null> => {
  const result = await query<QRCodeRecord>(
    `INSERT INTO qr_codes (url_id, qr_image_url)
     VALUES ($1, $2)
     RETURNING *`,
    [urlId, qrImageUrl]
  );
  return result.rows[0] || null;
};

export const getQRCodeByUrlId = async (urlId: number): Promise<QRCodeRecord | null> => {
  const result = await query<QRCodeRecord>(
    `SELECT * FROM qr_codes WHERE url_id = $1`,
    [urlId]
  );
  return result.rows[0] || null;
};

export const deleteQRCode = async (urlId: number): Promise<void> => {
  await query(
    `DELETE FROM qr_codes WHERE url_id = $1`,
    [urlId]
  );
};

export const getAllQRCodes = async (): Promise<QRCodeRecord[]> => {
  const result = await query<QRCodeRecord>(
    `SELECT * FROM qr_codes ORDER BY generated_at DESC`
  );
  return result.rows;
};
