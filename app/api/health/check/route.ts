import pool from '@/backend/src/utils/db';
import { delCache } from '@/backend/src/utils/redis';
import { getActiveUrlsForHealthCheck, updateUrlStatus } from '@/backend/src/utils/queries/urls';
import { upsertLinkHealth, recordHealthFailure, getHealthByUrlId } from '@/backend/src/utils/queries/health';

/**
 * GET /api/health/check â€” Background worker: check health of all active URLs.
 * In production, trigger via cron (e.g., Vercel Cron Jobs) every 6 hours.
 */
export async function GET() {
  const client = await pool.connect();
  try {
    // Get all active URLs
    const urls = await getActiveUrlsForHealthCheck(client, 500);

    let checked = 0;
    let dead = 0;

    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url.long_url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timeoutId);

        const statusCode = response.status;
        const isDead = statusCode >= 400;

        await upsertLinkHealth(client, url.url_id, statusCode, isDead);

        // If dead, check failure count threshold
        if (isDead) {
          const health = await getHealthByUrlId(client, url.url_id);
          if (health && health.failure_count >= 3) {
            await updateUrlStatus(client, url.url_id, 'dead');
            await delCache(url.short_code);
            dead++;
          }
        }

        checked++;
      } catch {
        // Network error â€” record failure
        await recordHealthFailure(client, url.url_id);
        checked++;
      }
    }

    return Response.json({
      message: 'Health check completed',
      checked,
      dead,
      total: urls.length,
    });
  } catch (error) {
    console.error('Health check error:', error);
    return Response.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

