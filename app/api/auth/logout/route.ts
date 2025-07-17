import { NextResponse } from 'next/server';
import { APIResponse } from '@/lib/types';

export async function POST(): Promise<NextResponse<APIResponse>> {
  const response = NextResponse.json({
    success: true,
    data: { message: 'Logout successful' },
  });

  // Clear the session cookie
  response.cookies.set('admin-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}