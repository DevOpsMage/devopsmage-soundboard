import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, getAuthErrorResponse } from '@/lib/session';
import { APIResponse } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    const session = await getSessionFromRequest(request);
    
    if (session?.isAuthenticated) {
      return NextResponse.json({
        success: true,
        data: { authenticated: true },
      });
    } else {
      return NextResponse.json(getAuthErrorResponse(), { status: 401 });
    }
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(getAuthErrorResponse(), { status: 500 });
  }
}