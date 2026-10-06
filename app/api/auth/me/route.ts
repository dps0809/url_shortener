import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '../middleware/auth.middleware';

export async function GET(req: NextRequest) {
  const user = await authMiddleware(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      profile_image: user.profile_image,
      provider: user.provider
    }
  });
}
