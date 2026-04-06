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
    return NextResponse.json({ total_clicks: Number(total_clicks) });
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
  const sDateStr = searchParams.get('startDate');
  const eDateStr = searchParams.get('endDate');

  // Strict check for Feb 30 etc.
  const isValidDate = (dStr: string | null) => {
    if (!dStr) return true;
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return false;
    // Check if components actually match to prevent rollover (e.g. Feb 30 -> Mar 2)
    const [year, month, day] = dStr.split('-').map(Number);
    if (year && month && day) {
        return d.getUTCFullYear() === year && (d.getUTCMonth() + 1) === month && d.getUTCDate() === day;
    }
    return true;
  };

  if (!isValidDate(sDateStr) || !isValidDate(eDateStr)) {
    return NextResponse.json({ error: 'startDate and endDate must be valid calendar dates' }, { status: 400 });
  }

  const startDate = sDateStr ? new Date(sDateStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = eDateStr ? new Date(eDateStr) : new Date();

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
