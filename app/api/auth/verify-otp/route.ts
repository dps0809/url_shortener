import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../services/user.service';
import { z } from 'zod';

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = verifyOtpSchema.parse(body);

    await UserService.verifyOTP(email, otp);

    return NextResponse.json({
      message: 'Email verified successfully. You can now log in.',
    }, { status: 200 });
  } catch (error: any) {
    console.error('OTP Verification error:', error);
    return NextResponse.json({ error: error.message || 'OTP verification failed' }, { status: 400 });
  }
}
