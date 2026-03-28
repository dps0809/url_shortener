import { PoolClient } from 'pg';

// ─── Create ───

export async function insertSafetyScan(
  client: PoolClient,
  urlId: number,
  scanResult: string,
  scanProvider: string
) {
  const { rows } = await client.query(
    `INSERT INTO safety_scan (url_id, scan_result, scan_provider)
     VALUES ($1, $2, $3)
     RETURNING scan_id, scanned_at`,
    [urlId, scanResult, scanProvider]
  );
  return rows[0] || null;
}

// ─── Read (latest scan for a URL) ───

export async function getLatestScan(client: PoolClient, urlId: number) {
  const { rows } = await client.query(
    `SELECT scan_id, url_id, scan_result, scan_provider, scanned_at
     FROM safety_scan
     WHERE url_id = $1
     ORDER BY scanned_at DESC
     LIMIT 1`,
    [urlId]
  );
  return rows[0] || null;
}

// ─── Read all scans for a URL ───

export async function getScansByUrlId(
  client: PoolClient,
  urlId: number,
  limit: number = 20,
  offset: number = 0
) {
  const countResult = await client.query(
    'SELECT COUNT(*) as total FROM safety_scan WHERE url_id = $1',
    [urlId]
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const { rows } = await client.query(
    `SELECT scan_id, url_id, scan_result, scan_provider, scanned_at
     FROM safety_scan
     WHERE url_id = $1
     ORDER BY scanned_at DESC
     LIMIT $2 OFFSET $3`,
    [urlId, limit, offset]
  );

  return { rows, total };
}
