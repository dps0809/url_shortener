import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    INTERNAL_API_SECRET_SET: !!process.env.INTERNAL_API_SECRET,
    INTERNAL_API_SECRET_VAL: process.env.INTERNAL_API_SECRET,
    NODE_ENV: process.env.NODE_ENV
  });
}
