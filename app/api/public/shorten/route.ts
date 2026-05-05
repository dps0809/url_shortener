import { NextRequest, NextResponse } from 'next/server';
import pool from '@/backend/src/utils/db';
import { createShortUrl } from '@/backend/src/services/url.service';
import { validateCreateUrl } from '@/backend/src/validators/url.validator';
import { redis } from '@/backend/src/utils/redis';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const PUBLIC_RATE_LIMIT = 10;
const WINDOW_SECONDS = 3600; // 1 hour

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateLimitKey = `ratelimit:public:shorten:${ip}`;

  try {
    // 1. IP-based Rate Limiting via Redis
    const currentUsage = await redis.get(rateLimitKey);
    const usageCount = currentUsage ? parseInt(currentUsage, 10) : 0;

    if (usageCount >= PUBLIC_RATE_LIMIT) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 10 shortens per hour for public users.' },
        { status: 429 }
      );
    }

    // 2. Validate Body
    const body = await request.json();
    const validationError = validateCreateUrl(body);
    if (validationError) return validationError;

    const { long_url: longUrl } = body;

    // 3. Create Short URL (userId = null for public)
    const url = await createShortUrl(longUrl, null);
    const shortUrl = `${BASE_URL}/${url.short_code}`;

    // 4. Increment Rate Limit
    if (usageCount === 0) {
      await redis.set(rateLimitKey, 1, 'EX', WINDOW_SECONDS);
    } else {
      await redis.incr(rateLimitKey);
    }

    return NextResponse.json(
      {
        message: 'Short URL created successfully',
        url_id: url.url_id,
        short_code: url.short_code,
        short_url: shortUrl,
        long_url: url.long_url,
        created_at: url.created_at,
        rate_limit: {
          remaining: PUBLIC_RATE_LIMIT - (usageCount + 1),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    if (errorMsg.startsWith('URL blocked')) {
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      );
    }
    
    // DEBUG: Log the full error to console and return detailed error to client
    console.error('[Public Shorten API] FATAL ERROR:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMsg,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
