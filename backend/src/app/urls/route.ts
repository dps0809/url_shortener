import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../utils/auth';
import { createShortUrl, getUserUrls } from '../../services/url.service';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { long_url, custom_alias, expiry_date } = body;

    if (!long_url) {
      return NextResponse.json({ error: 'long_url is required' }, { status: 400 });
    }

    const expiryDate = expiry_date ? new Date(expiry_date) : undefined;
    
    // Check if customAlias has valid characters if needed, skipping for now as createShortUrl will handle
    const urlRecord = await createShortUrl(long_url, user.userId, custom_alias, expiryDate);

    if (!urlRecord) {
      return NextResponse.json({ error: 'Failed to create short URL' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    return NextResponse.json({
      short_url: `${baseUrl}/${urlRecord.short_code}`,
      expires_at: urlRecord.expiry_date
    }, { status: 201 });

  } catch (error: any) {
    if (error instanceof Response) return error; // Thrown by requireAuth
    const status = error.message.includes('Rate limit') ? 429 : 
                   error.message.includes('already in use') ? 409 : 400;
                   
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const urls = await getUserUrls(user.userId, limit, offset);

    return NextResponse.json(urls);
  } catch (error: any) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
