import { NextRequest, NextResponse } from 'next/server';
import { getSystemMetrics } from '../../../services/metrics.service';

export async function GET(request: NextRequest) {
  try {
    const metrics = await getSystemMetrics();
    
    // Parse Redis info string to get used memory
    let redisMemory = '0MB';
    if (metrics.cache && metrics.cache.info) {
      const match = metrics.cache.info.match(/used_memory_human:([^\r\n]+)/);
      if (match && match[1]) {
        redisMemory = match[1];
      }
    }

    return NextResponse.json({
      total_urls: metrics.urlsCount,
      total_clicks: metrics.totalClicks,
      redis_memory: redisMemory
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
