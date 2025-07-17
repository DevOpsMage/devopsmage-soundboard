import { NextRequest } from 'next/server';
import { ERROR_CODES } from './types';

export function validateAdminPassword(request: NextRequest): boolean {
  const password = request.headers.get('x-admin-password');
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable is not set');
    return false;
  }

  if (!password) {
    return false;
  }

  return password === adminPassword;
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

export function getAuthErrorResponse(request: NextRequest) {
  const password = request.headers.get('x-admin-password');
  
  if (!password) {
    return createAuthError(ERROR_CODES.MISSING_PASSWORD, 'Admin password is required');
  }
  
  return createAuthError(ERROR_CODES.INVALID_PASSWORD, 'Invalid admin password');
}