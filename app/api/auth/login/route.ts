import { NextRequest } from 'next/server';
import pool from '@/backend/src/utils/db';
import { comparePassword, signToken } from '@/backend/src/utils/auth';
import { getUserByEmail } from '@/backend/src/utils/queries/users';
import { createSession } from '@/backend/src/utils/queries/sessions';

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Lookup user (uses password_h column)
    const user = await getUserByEmail(client, email.toLowerCase().trim());
    if (!user) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Compare password
    const isValid = await comparePassword(password, user.password_h);
    if (!isValid) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const session = await createSession(client, user.user_id, expiresAt, ip);

    // Sign JWT
    const token = signToken({
      userId: user.user_id,
      sessionId: session.session_id,
      role: user.role,
    });

    return Response.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.user_id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

