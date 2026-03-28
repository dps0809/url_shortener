import { NextRequest } from 'next/server';
import { getSession } from '@/backend/src/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request);

    if (!user) {
      return Response.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return Response.json({
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

