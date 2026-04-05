import { NextRequest, NextResponse } from 'next/server';
import { 
  disableUrl, 
  enableUrl, 
  updateExpiry 
} from '../services/url.service';
import { getUrlById } from '../models/url.model';
import { delCache } from '../utils/redis';

/**
 * 10. GET /urls/:id/status - Check link state
 */
export async function getStatusHandler(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  try {
    const url = await getUrlById(id);
    if (!url) return NextResponse.json({ error: 'URL not found' }, { status: 404 });

    return NextResponse.json({
      status: url.status,
      expires_at: url.expiry_date
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 11. PATCH /urls/:id/disable - Temporarily disable a link
 */
export async function disableUrlHandler(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  try {
    const url = await getUrlById(id);
    if (!url) return NextResponse.json({ error: 'URL not found' }, { status: 404 });

    await disableUrl(id);
    await delCache(`short:${url.short_code}`);

    return NextResponse.json({ message: 'URL disabled' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 12. PATCH /urls/:id/enable - Re-enable a disabled link
 */
export async function enableUrlHandler(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  try {
    const url = await getUrlById(id);
    if (!url) return NextResponse.json({ error: 'URL not found' }, { status: 404 });

    await enableUrl(id);
    // Cache will be recreated on next request

    return NextResponse.json({ message: 'URL enabled' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 13. PATCH /urls/:id/extend - Extend expiration time
 */
export async function extendUrlHandler(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  try {
    const { expiry_date } = await req.json();
    if (!expiry_date) return NextResponse.json({ error: 'expiry_date is required' }, { status: 400 });

    const updated = await updateExpiry(id, new Date(expiry_date));
    if (updated) {
      // Redis TTL is updated on next redirect fetch or manually here if needed
      await delCache(`short:${updated.short_code}`);
    }

    return NextResponse.json({ message: 'URL expiration extended' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
