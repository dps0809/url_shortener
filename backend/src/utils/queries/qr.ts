import { PoolClient } from 'pg';

// ─── Create ───

export async function insertQrCode(
  client: PoolClient,
  urlId: number,
  qrImageUrl: string
) {
  const { rows } = await client.query(
    `INSERT INTO qr_codes (url_id, qr_image_url)
     VALUES ($1, $2)
     RETURNING qr_id, generated_at`,
    [urlId, qrImageUrl]
  );
  return rows[0] || null;
}

// ─── Read ───

export async function getQrByUrlId(client: PoolClient, urlId: number) {
  const { rows } = await client.query(
    `SELECT qr_id, url_id, qr_image_url, generated_at
     FROM qr_codes
     WHERE url_id = $1`,
    [urlId]
  );
  return rows[0] || null;
}

// ─── Update (regenerate) ───

export async function updateQrImageUrl(
  client: PoolClient,
  urlId: number,
  qrImageUrl: string
) {
  const { rowCount } = await client.query(
    `UPDATE qr_codes
     SET qr_image_url = $1, generated_at = (NOW() AT TIME ZONE 'UTC')
     WHERE url_id = $2`,
    [qrImageUrl, urlId]
  );
  return (rowCount ?? 0) > 0;
}
