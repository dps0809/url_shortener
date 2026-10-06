import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../services/user.service';
import { z } from 'zod';

const googleAuthSchema = z.object({
  code: z.string()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = googleAuthSchema.parse(body);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Google token exchange error:', errorData);
      throw new Error('Failed to exchange Google authorization code');
    }

    const tokenData = await tokenResponse.json();

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user profile from Google');
    }

    const profileData = await userResponse.json();

    const { user, token } = await UserService.loginWithGoogle({
      name: profileData.name,
      email: profileData.email,
      image: profileData.picture,
    });

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
