import { NextRequest, NextResponse } from 'next/server';
import { 
  getTotalClicks, 
  getDailyAnalytics, 
  getCountryAnalytics,
  getDeviceAnalytics
} from '../services/analytics.service';
import { withAuth, isAuthError } from '../middleware/auth.middleware';
import { validateIdParam } from '../validators/url.validator';

/**
 * 7. GET /urls/:id/analytics - Total clicks
 */
export async function getTotalClicksHandler(req: NextRequest, { params }: { params: { id: string } }) {
  // ── Auth gate ──
  const authResult = await withAuth(req);
  if (isAuthError(authResult)) return authResult;

  // ── Param validation ──
  const idError = validateIdParam(params.id);
  if (idError) return idError;
  const id = parseInt(params.id);

  try {
    const total_clicks = await getTotalClicks(id);
    return NextResponse.json({ total_clicks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 8. GET /urls/:id/analytics/daily - Daily click stats
 */
export async function getDailyAnalyticsHandler(req: NextRequest, { params }: { params: { id: string } }) {
  // ── Auth gate ──
  const authResult = await withAuth(req);
  if (isAuthError(authResult)) return authResult;

  // ── Param validation ──
  const idError = validateIdParam(params.id);
  if (idError) return idError;
  const id = parseInt(params.id);

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: 'startDate and endDate must be valid ISO date strings' }, { status: 400 });
  }

  if (startDate > endDate) {
    return NextResponse.json({ error: 'startDate must be before endDate' }, { status: 400 });
  }

  try {
    const stats = await getDailyAnalytics(id, startDate, endDate);
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 9. GET /urls/:id/analytics/countries - Click distribution by country
 */
export async function getCountryAnalyticsHandler(req: NextRequest, { params }: { params: { id: string } }) {
  // ── Auth gate ──
  const authResult = await withAuth(req);
  if (isAuthError(authResult)) return authResult;

  // ── Param validation ──
  const idError = validateIdParam(params.id);
  if (idError) return idError;
  const id = parseInt(params.id);

  try {
    const stats = await getCountryAnalytics(id);
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Additional: GET /urls/:id/analytics/devices - Click distribution by device
 */
export async function getDeviceAnalyticsHandler(req: NextRequest, { params }: { params: { id: string } }) {
  // ── Auth gate ──
  const authResult = await withAuth(req);
  if (isAuthError(authResult)) return authResult;

  // ── Param validation ──
  const idError = validateIdParam(params.id);
  if (idError) return idError;
  const id = parseInt(params.id);

  try {
    const stats = await getDeviceAnalytics(id);
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
