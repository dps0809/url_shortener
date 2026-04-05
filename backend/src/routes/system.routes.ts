import { NextRequest, NextResponse } from 'next/server';
import { getSystemMetrics } from '../services/metrics.service';
import { getActiveWorkerCount } from '../services/queue.service';
import { getRemainingQuota, getRemainingRedirectQuota } from '../services/rateLimit.service';
import pool from '../utils/db';
import { redis } from '../utils/redis';
import { withAuth, isAuthError } from '../middleware/auth.middleware';

/**
 * 15. GET /health - Check system health
 * NOTE: Health check is public — no auth required.
 */
export async function healthCheckHandler() {
  try {
    // Check DB
    await pool.query('SELECT 1');
    const dbStatus = 'healthy';

    // Check Redis
    await redis.ping();
    const redisStatus = 'healthy';

    // Check Workers
    const workerInfo = await getActiveWorkerCount();
    const workersStatus = workerInfo.total > 0 ? 'healthy' : 'degraded';

    return NextResponse.json({
      database: dbStatus,
      redis: redisStatus,
      workers: workersStatus,
      worker_detail: workerInfo.detail
    });
  } catch (error: any) {
    return NextResponse.json({
      database: 'unhealthy',
      redis: 'unhealthy',
      error: error.message
    }, { status: 503 });
  }
}

/**
 * 16. GET /metrics - Expose system metrics
 */
export async function getMetricsHandler() {
  try {
    const metrics = await getSystemMetrics();
    return NextResponse.json({
      total_urls: metrics.urlsCount,
      total_clicks: metrics.totalClicks,
      redis_memory: metrics.cache.info.match(/used_memory_human:(.*)/)?.[1] || 'unknown'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 17. GET /rate-limit - Show remaining quota
 */
export async function getRateLimitHandler(req: NextRequest) {
  // ── Auth gate ──
  const authResult = await withAuth(req);
  if (isAuthError(authResult)) return authResult;
  const userId = authResult.userId;

  // Extract IP for redirect quota
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  try {
    const [creationsRemaining, redirectsRemaining] = await Promise.all([
      getRemainingQuota(userId),
      getRemainingRedirectQuota(ipAddress)
    ]);

    return NextResponse.json({
      creations_remaining: creationsRemaining,
      redirects_remaining: redirectsRemaining
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
