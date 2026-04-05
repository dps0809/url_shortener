import { NextRequest, NextResponse } from 'next/server';
import { 
  disableUrl, 
  enableUrl, 
  updateExpiry 
} from '../services/url.service';
import { getUrlById } from '../models/url.model';
import { delCache } from '../utils/redis';
import { withAuth, isAuthError } from '../middleware/auth.middleware';
import { validateIdParam, validateUpdateExpiry } from '../validators/url.validator';

/**
 * 10. GET /urls/:id/status - Check link state
 */
export async function getStatusHandler(req: NextRequest, { params }: { params: { id: string } }) {
  // ── Auth gate ──
  const authResult = await withAuth(req);
  if (isAuthError(authResult)) return authResult;

  // ── Param validation ──
  const idError = validateIdParam(params.id);
  if (idError) return idError;
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
  // ── Auth gate ──
  const authResult = await withAuth(req);
  if (isAuthError(authResult)) return authResult;

  // ── Param validation ──
  const idError = validateIdParam(params.id);
  if (idError) return idError;
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
  // ── Auth gate ──
  const authResult = await withAuth(req);
  if (isAuthError(authResult)) return authResult;

  // ── Param validation ──
  const idError = validateIdParam(params.id);
  if (idError) return idError;
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
  // ── Auth gate ──
  const authResult = await withAuth(req);
  if (isAuthError(authResult)) return authResult;

  // ── Param validation ──
  const idError = validateIdParam(params.id);
  if (idError) return idError;
  const id = parseInt(params.id);

  try {
    const body = await req.json();

    // ── Input validation ──
    const validationError = validateUpdateExpiry(body);
    if (validationError) return validationError;

    const updated = await updateExpiry(id, new Date(body.expiry_date));
    if (updated) {
      await delCache(`short:${updated.short_code}`);
    }

    return NextResponse.json({ message: 'URL expiration extended' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
