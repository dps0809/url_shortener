import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';  
import pool from './db';
import { UserModel } from '@/app/auth/models/user.model';

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
  user_id: number;
  email: string;
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
  name: string;
}

/**
 * Extract and validate the user session from a request.
 * Expects: Authorization: Bearer <token>
 * Acquires its own client since this runs before route-level pool.connect().
 */
export async function getSession(request: Request): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.slice(7);
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const payload = jwt.verify(token, secret) as TokenPayload;
    if (!payload || !payload.user_id) return null;

    const user = await UserModel.findById(payload.user_id);
    if (!user || !user.is_active) return null;

    return {
      userId: user.id,
      email: user.email,
      role: 'user', // Default for now, or fetch from roles table if it exists
      name: user.name,
    };
  } catch (err) {
    console.error('Auth check failed:', err);
    return null;
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
