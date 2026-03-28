import { NextRequest } from 'next/server';
import pool from '@/backend/src/utils/db';
import { hashPassword, signToken } from '@/backend/src/utils/auth';
import { createUser, checkEmailExists } from '@/backend/src/utils/queries/users';
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

    if (typeof email !== 'string' || !email.includes('@')) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 8) {
      return Response.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const exists = await checkEmailExists(client, normalizedEmail);
    if (exists) {
      return Response.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password & insert user
    const passwordHash = await hashPassword(password);
    const user = await createUser(client, normalizedEmail, passwordHash);

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

    return Response.json(
      {
        message: 'Registration successful',
        token,
        user: {
          userId: user.user_id,
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

