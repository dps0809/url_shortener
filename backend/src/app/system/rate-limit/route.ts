import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/auth';
import { getRemainingQuota } from '../../../services/rateLimit.service';
import { redis } from '../../../utils/redis';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const creationsRemaining = await getRemainingQuota(user.userId);
    
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const redirectKey = `ratelimit:redirect:${ipAddress}`;
    const redirectUsedStr = await redis.get(redirectKey);
    const redirectUsed = redirectUsedStr ? parseInt(redirectUsedStr, 10) : 0;
    const redirectsRemaining = Math.max(0, 20 - redirectUsed);

    return NextResponse.json({
      redirects_remaining: redirectsRemaining,
      creations_remaining: creationsRemaining
    });
  } catch (error: any) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
