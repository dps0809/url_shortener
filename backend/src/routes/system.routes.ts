import { NextRequest, NextResponse } from 'next/server';
import { getSystemMetrics } from '../services/metrics.service';
import { getRemainingQuota } from '../services/rateLimit.service';
import pool from '../utils/db';
import { redis } from '../utils/redis';

/**
 * 15. GET /health - Check system health
 */
export async function healthCheckHandler() {
  try {
    // Check DB
    await pool.query('SELECT 1');
    const dbStatus = 'healthy';

    // Check Redis
    await redis.ping();
    const redisStatus = 'healthy';

    return NextResponse.json({
      database: dbStatus,
      redis: redisStatus,
      workers: 'running' // Simplified check
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
  const userId = 1; // Mock user
  try {
    const remaining = await getRemainingQuota(userId);
    return NextResponse.json({
      creations_remaining: remaining,
      redirects_remaining: 100 // Example static value or fetch from Redis
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
