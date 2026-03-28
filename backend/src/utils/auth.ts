import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db';
import { getSessionWithUser } from './queries/sessions';

const SALT_ROUNDS = 12;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return secret;
}

// ─── Password Utilities ───

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function comparePassword(
  plainPassword: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

// ─── JWT Utilities ───

export interface TokenPayload {
  userId: number;
  sessionId: string;
  role: string;
}

export function signToken(payload: TokenPayload, expiresInSeconds: number = 604800): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: expiresInSeconds });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch {
    return null;
  }
}

// ─── Session Middleware ───

export interface AuthUser {
  userId: number;
  email: string;
  role: string;
  sessionId: string;
}

/**
 * Extract and validate the user session from a request.
 * Expects: Authorization: Bearer <token>
 * Acquires its own client since this runs before route-level pool.connect().
 */
export async function getSession(request: Request): Promise<AuthUser | null> {
  const client = await pool.connect();
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload) return null;

    // Verify session still exists in DB
    const session = await getSessionWithUser(client, payload.sessionId, payload.userId);
    if (!session) return null;

    // Check if session expired or user deactivated
    if (new Date(session.expires_at) < new Date()) return null;
    if (!session.is_active) return null;

    return {
      userId: session.user_id,
      email: session.email,
      role: session.role,
      sessionId: session.session_id,
    };
  } catch {
    return null;
  } finally {
    client.release();
  }
}

/**
 * Require authentication — returns user or throws a Response.
 */
export async function requireAuth(request: Request): Promise<AuthUser> {
  const user = await getSession(request);
  if (!user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}

/**
 * Require admin role — returns user or throws a Response.
 */
export async function requireAdmin(request: Request): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (user.role !== 'admin') {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}
