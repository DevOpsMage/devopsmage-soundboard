import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getSessionFromRequest, getAuthErrorResponse } from '@/lib/session';
import { APIResponse, ERROR_CODES } from '@/lib/types';

const AUDIO_DIR = join(process.cwd(), 'public', 'audio');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '2097152'); // 2MB default
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/flac',
  'audio/ogg',
  'audio/m4a',
  'audio/aac',
  'audio/x-wav',
  'audio/x-flac',
];

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
}

function validateAudioFile(file: File): { valid: boolean; error?: string; code?: number } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      code: ERROR_CODES.FILE_TOO_LARGE,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only audio files are allowed.',
      code: ERROR_CODES.INVALID_FILE_TYPE,
    };
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'];
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'Invalid file extension. Allowed: ' + allowedExtensions.join(', '),
      code: ERROR_CODES.INVALID_FILE_TYPE,
    };
  }

  return { valid: true };
}

interface UploadResult {
  filename: string;
  success: boolean;
  error?: string;
  code?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    // Validate admin session
    const session = await getSessionFromRequest(request);
    if (!session?.isAuthenticated) {
      return NextResponse.json(getAuthErrorResponse(), { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: ERROR_CODES.BAD_REQUEST,
          message: 'No files provided',
        },
      }, { status: 400 });
    }

    // Ensure audio directory exists
    if (!existsSync(AUDIO_DIR)) {
      mkdirSync(AUDIO_DIR, { recursive: true });
    }

    const results: UploadResult[] = [];
    let hasErrors = false;

    // Process each file
    for (const file of files) {
      try {
        // Validate file
        const validation = validateAudioFile(file);
        if (!validation.valid) {
          results.push({
            filename: file.name,
            success: false,
            error: validation.error,
            code: validation.code,
          });
          hasErrors = true;
          continue;
        }

        // Sanitize filename
        const sanitizedFilename = sanitizeFilename(file.name);
        const filePath = join(AUDIO_DIR, sanitizedFilename);

        // Check if file already exists
        if (existsSync(filePath)) {
          results.push({
            filename: file.name,
            success: false,
            error: 'File already exists',
            code: ERROR_CODES.BAD_REQUEST,
          });
          hasErrors = true;
          continue;
        }

        // Convert file to buffer and write
        const buffer = Buffer.from(await file.arrayBuffer());
        writeFileSync(filePath, buffer);

        results.push({
          filename: sanitizedFilename,
          success: true,
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        results.push({
          filename: file.name,
          success: false,
          error: 'Upload failed',
          code: ERROR_CODES.UPLOAD_FAILED,
        });
        hasErrors = true;
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return NextResponse.json({
      success: !hasErrors || successCount > 0,
      data: {
        results,
        summary: {
          total: totalCount,
          success: successCount,
          failed: totalCount - successCount,
        },
        message: hasErrors 
          ? `${successCount}/${totalCount} files uploaded successfully`
          : `All ${totalCount} files uploaded successfully`,
      },
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: ERROR_CODES.UPLOAD_FAILED,
        message: 'Failed to upload files',
      },
    }, { status: 500 });
  }
}