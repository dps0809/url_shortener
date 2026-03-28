import { NextRequest } from 'next/server';
import pool from '@/backend/src/utils/db';
import { verifyToken } from '@/backend/src/utils/auth';
import { deleteSession } from '@/backend/src/utils/queries/sessions';

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    if (!payload) {
      return Response.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Delete the session
    await deleteSession(client, payload.sessionId, payload.userId);

    return Response.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

