import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../services/user.service';
import { z } from 'zod';

const googleAuthSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  image: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = googleAuthSchema.parse(body);

    const { user, token } = await UserService.loginWithGoogle(profile);

    return NextResponse.json({
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile_image: user.profile_image
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Google Auth error:', error);
    return NextResponse.json({ error: error.message || 'Google authentication failed' }, { status: 400 });
  }
}
