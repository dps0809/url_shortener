import { NextRequest } from 'next/server';
import pool from '@/backend/src/utils/db';
import { requireAdmin } from '@/backend/src/utils/auth';
import { updateUserRole, getUserById } from '@/backend/src/utils/queries/users';

/**
 * POST /api/admin/promote — Promote a specific user to admin
 * Required: Admin role
 */
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    // 1. Authenticate and verify admin role
    await requireAdmin(request);

    // 2. Parse request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 3. Verify user exists
    const userToPromote = await getUserById(client, parseInt(userId as string, 10));
    if (!userToPromote) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Update the user role to 'admin'
    const success = await updateUserRole(client, parseInt(userId as string, 10), 'admin');

    if (!success) {
      return Response.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    return Response.json({
      message: `User ${userToPromote.email} has been promoted to Admin successfully.`,
      userId: userId,
      newRole: 'admin'
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Admin promotion error:', error);
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
