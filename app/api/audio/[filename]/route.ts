import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const AUDIO_DIR = join(process.cwd(), 'public', 'audio');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
): Promise<NextResponse> {
  try {
    const { filename } = await params;

    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-_]/g, '');
    
    // Security check: ensure filename has valid audio extension
    if (!/\.(mp3|wav|flac|ogg|m4a|aac)$/i.test(sanitizedFilename)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const filePath = join(AUDIO_DIR, sanitizedFilename);

    // Ensure the file is within the audio directory
    if (!filePath.startsWith(AUDIO_DIR)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stats = statSync(filePath);
    const fileBuffer = readFileSync(filePath);

    // Get MIME type based on file extension
    const getMimeType = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'mp3':
          return 'audio/mpeg';
        case 'wav':
          return 'audio/wav';
        case 'flac':
          return 'audio/flac';
        case 'ogg':
          return 'audio/ogg';
        case 'm4a':
          return 'audio/mp4';
        case 'aac':
          return 'audio/aac';
        default:
          return 'audio/mpeg';
      }
    };

    const mimeType = getMimeType(sanitizedFilename);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    console.error('Error serving audio file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}