import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Section 10: Client deletes token. Server-side logout is stateless for JWT (unless using blacklist).
  return NextResponse.json({ message: 'Logged out successfully' });
}
