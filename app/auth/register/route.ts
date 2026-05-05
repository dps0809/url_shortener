import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../services/user.service';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    const user = await UserService.registerUser({
      name: validatedData.name,
      username: validatedData.username,
      email: validatedData.email,
      password: validatedData.password,
      phone: validatedData.phone || '',
    });

    return NextResponse.json({
      message: 'Registration successful. Please check your email for the verification code.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        is_verified: user.is_verified
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 400 });
  }
}
