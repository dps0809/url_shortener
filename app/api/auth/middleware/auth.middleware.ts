import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function authMiddleware(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null; // Let the route handle the 401 if it's protected
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { user_id: number; email: string };
    
    // Attach user to request (using headers since Next.js Request isn't easily mutable)
    const user = await UserModel.findById(decoded.user_id);
    if (!user || !user.is_active) return null;

    return user;
  } catch (error) {
    console.error('JWT Verification failed:', error);
    return null;
  }
}
