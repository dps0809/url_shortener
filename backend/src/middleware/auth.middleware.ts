import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth, requireAdmin, AuthUser } from '../utils/auth';

/**
 * Extracts the authenticated user from the request.
 * Returns the AuthUser or a 401 NextResponse.
 */
export async function withAuth(req: NextRequest): Promise<AuthUser | NextResponse> {
  try {
    const user = await requireAuth(req);
    return user;
  } catch (thrown: unknown) {
    // requireAuth throws a Response on failure
    if (thrown instanceof Response) {
      const body = await thrown.json();
      return NextResponse.json(body, { status: thrown.status });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

/**
 * Extracts the authenticated admin user from the request.
 * Returns the AuthUser (admin) or a 401/403 NextResponse.
 */
export async function withAdmin(req: NextRequest): Promise<AuthUser | NextResponse> {
  try {
    const user = await requireAdmin(req);
    return user;
  } catch (thrown: unknown) {
    if (thrown instanceof Response) {
      const body = await thrown.json();
      return NextResponse.json(body, { status: thrown.status });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

/**
 * Type guard to check if the auth result is a NextResponse (i.e. auth failed).
 */
export function isAuthError(result: AuthUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
