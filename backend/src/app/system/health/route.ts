import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../utils/db';
import { redis } from '../../../utils/redis';

export async function GET(request: NextRequest) {
  try {
    let database = 'unhealthy';
    let redisStatus = 'unhealthy';

    // Check DB
    try {
      await pool.query('SELECT 1');
      database = 'healthy';
    } catch (e) {
      console.error('Database health check failed:', e);
    }

    // Check Redis
    try {
      const ping = await redis.ping();
      if (ping === 'PONG') {
        redisStatus = 'healthy';
      }
    } catch (e) {
      console.error('Redis health check failed:', e);
    }

    const isHealthy = database === 'healthy' && redisStatus === 'healthy';

    return NextResponse.json({
      database,
      redis: redisStatus,
      workers: 'running' // Placeholder for worker status if tracking is separate
    }, { status: isHealthy ? 200 : 503 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
