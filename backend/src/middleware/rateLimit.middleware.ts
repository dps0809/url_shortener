import { NextResponse } from 'next/server';
import { redis } from '../utils/redis';

export async function checkRateLimit(
  userId: string,
  type: 'redirect' | 'create'
): Promise<NextResponse | null> {
  const key = `rate:${type}:user:${userId}`;

  try {
    const currentCount = await redis.incr(key);

    if (currentCount === 1) {
      if (type === 'redirect') {
        await redis.expire(key, 60);
      } else {
        await redis.expire(key, 86400); // 24 hours
      }
    }

    if (type === 'redirect' && currentCount > 20) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    if (type === 'create' && currentCount > 50) {
      return NextResponse.json(
        { error: 'Daily creation limit reached' },
        { status: 403 }
      );
    }

    return null; // Passed
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open if Redis crashes so we don't block legitimate traffic completely
    return null;
  }
}
