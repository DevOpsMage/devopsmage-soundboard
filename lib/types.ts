export interface Sound {
  name: string;
  file: string;
}

export interface Category {
  name: string;
  sounds: Sound[];
}

export interface SoundboardConfig {
  categories: Category[];
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
  };
}

export const ERROR_CODES = {
  // Authentication errors (1000-1099)
  INVALID_PASSWORD: 1001,
  MISSING_PASSWORD: 1002,

  // File errors (1100-1199)
  FILE_NOT_FOUND: 1101,
  FILE_TOO_LARGE: 1102,
  INVALID_FILE_TYPE: 1103,
  UPLOAD_FAILED: 1104,
  DELETE_FAILED: 1105,

  // Configuration errors (1200-1299)
  CONFIG_READ_ERROR: 1201,
  CONFIG_WRITE_ERROR: 1202,
  CONFIG_PARSE_ERROR: 1203,
  CONFIG_VALIDATION_ERROR: 1204,

  // General errors (1300-1399)
  INTERNAL_SERVER_ERROR: 1301,
  METHOD_NOT_ALLOWED: 1302,
  BAD_REQUEST: 1303,
} as const;