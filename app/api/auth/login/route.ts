import { NextRequest, NextResponse } from 'next/server';
import { validatePassword, createSession, createAuthResponse, getAuthErrorResponse } from '@/lib/session';
import { APIResponse, ERROR_CODES } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({
        success: false,
        error: {
          code: ERROR_CODES.MISSING_PASSWORD,
          message: 'Password is required',
        },
      }, { status: 400 });
    }

    if (await validatePassword(password)) {
      const token = await createSession();
      return createAuthResponse(token);
    } else {
      return NextResponse.json(getAuthErrorResponse(), { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Authentication failed',
      },
    }, { status: 500 });
  }
}