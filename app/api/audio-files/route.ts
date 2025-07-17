import { NextRequest, NextResponse } from 'next/server';
import { readdirSync, unlinkSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { getSessionFromRequest, getAuthErrorResponse } from '@/lib/session';
import { APIResponse, ERROR_CODES } from '@/lib/types';

const AUDIO_DIR = join(process.cwd(), 'public', 'audio');

export async function GET(request: NextRequest): Promise<NextResponse<APIResponse<string[]>>> {
  try {
    // Validate admin session
    const session = await getSessionFromRequest(request);
    if (!session?.isAuthenticated) {
      return NextResponse.json(getAuthErrorResponse(), { status: 401 });
    }

    if (!existsSync(AUDIO_DIR)) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const files = readdirSync(AUDIO_DIR)
      .filter(file => {
        const filePath = join(AUDIO_DIR, file);
        return statSync(filePath).isFile() && /\.(mp3|wav|flac|ogg|m4a|aac)$/i.test(file);
      })
      .sort();

    return NextResponse.json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error('Error reading audio files:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: ERROR_CODES.FILE_NOT_FOUND,
        message: 'Failed to read audio files',
      },
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    // Validate admin session
    const session = await getSessionFromRequest(request);
    if (!session?.isAuthenticated) {
      return NextResponse.json(getAuthErrorResponse(), { status: 401 });
    }

    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json({
        success: false,
        error: {
          code: ERROR_CODES.BAD_REQUEST,
          message: 'Filename is required',
        },
      }, { status: 400 });
    }

    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '');
    const filePath = join(AUDIO_DIR, sanitizedFilename);

    // Ensure the file is within the audio directory
    if (!filePath.startsWith(AUDIO_DIR)) {
      return NextResponse.json({
        success: false,
        error: {
          code: ERROR_CODES.BAD_REQUEST,
          message: 'Invalid filename',
        },
      }, { status: 400 });
    }

    if (!existsSync(filePath)) {
      return NextResponse.json({
        success: false,
        error: {
          code: ERROR_CODES.FILE_NOT_FOUND,
          message: 'File not found',
        },
      }, { status: 404 });
    }

    unlinkSync(filePath);

    return NextResponse.json({
      success: true,
      data: { message: 'File deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: ERROR_CODES.DELETE_FAILED,
        message: 'Failed to delete file',
      },
    }, { status: 500 });
  }
}