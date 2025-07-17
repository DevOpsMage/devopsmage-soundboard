import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { join } from 'path';
import { parse, stringify } from 'yaml';
import { getSessionFromRequest, getAuthErrorResponse } from '@/lib/session';
import { SoundboardConfig, APIResponse, ERROR_CODES } from '@/lib/types';

const CONFIG_PATH = join(process.cwd(), 'sounds.yaml');
const BACKUP_PATH = join(process.cwd(), 'sounds.yaml.bak');

export async function GET(): Promise<NextResponse<APIResponse<SoundboardConfig>>> {
  try {
    if (!existsSync(CONFIG_PATH)) {
      return NextResponse.json({
        success: false,
        error: {
          code: ERROR_CODES.FILE_NOT_FOUND,
          message: 'Configuration file not found',
        },
      }, { status: 404 });
    }

    const configContent = readFileSync(CONFIG_PATH, 'utf8');
    const config = parse(configContent) as SoundboardConfig;

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error reading config:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: ERROR_CODES.CONFIG_READ_ERROR,
        message: 'Failed to read configuration',
      },
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    // Validate admin session
    const session = await getSessionFromRequest(request);
    if (!session?.isAuthenticated) {
      return NextResponse.json(getAuthErrorResponse(), { status: 401 });
    }

    const config = await request.json();

    // Validate config structure
    if (!config.categories || !Array.isArray(config.categories)) {
      return NextResponse.json({
        success: false,
        error: {
          code: ERROR_CODES.CONFIG_VALIDATION_ERROR,
          message: 'Invalid configuration structure',
        },
      }, { status: 400 });
    }

    // Create backup if original exists
    if (existsSync(CONFIG_PATH)) {
      copyFileSync(CONFIG_PATH, BACKUP_PATH);
    }

    // Write new config
    const yamlContent = stringify(config);
    writeFileSync(CONFIG_PATH, yamlContent, 'utf8');

    return NextResponse.json({
      success: true,
      data: { message: 'Configuration updated successfully' },
    });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: ERROR_CODES.CONFIG_WRITE_ERROR,
        message: 'Failed to update configuration',
      },
    }, { status: 500 });
  }
}