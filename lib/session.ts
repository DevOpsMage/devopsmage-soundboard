import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { ERROR_CODES } from './types';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

interface SessionData {
  isAuthenticated: boolean;
  timestamp: number;
  [key: string]: any;
}

export async function createSession(): Promise<string> {
  const sessionData: SessionData = {
    isAuthenticated: true,
    timestamp: Date.now(),
  };

  const token = await new SignJWT(sessionData)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  return token;
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as SessionData;
  } catch (error) {
    return null;
  }
}

export async function validatePassword(password: string): Promise<boolean> {
  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD environment variable is not set');
    return false;
  }

  return password === ADMIN_PASSWORD;
}

export async function getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
  // Check for session cookie first
  const sessionCookie = request.cookies.get('admin-session');
  if (sessionCookie) {
    const sessionData = await verifySession(sessionCookie.value);
    if (sessionData) {
      return sessionData;
    }
  }

  // Fallback to header-based authentication for backward compatibility
  const password = request.headers.get('x-admin-password');
  if (password && await validatePassword(password)) {
    return {
      isAuthenticated: true,
      timestamp: Date.now(),
    };
  }

  return null;
}

export function createAuthError(code: number, message: string) {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

export function getAuthErrorResponse() {
  return createAuthError(ERROR_CODES.INVALID_PASSWORD, 'Authentication required');
}

export function createAuthResponse(token: string): NextResponse<any> {
  const response = NextResponse.json({
    success: true,
    data: { message: 'Authentication successful' },
  });

  // Set secure cookie
  response.cookies.set('admin-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });

  return response;
}