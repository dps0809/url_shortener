import { NextResponse } from 'next/server';

// ─── Validation Helpers ───

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isValidAlias(alias: string): boolean {
  // 3-10 alphanumeric/hyphen characters to match DB VARCHAR(10)
  return /^[a-zA-Z0-9-]{3,10}$/.test(alias);
}

function isValidFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date > new Date();
}

function isPositiveInt(value: unknown): boolean {
  if (typeof value === 'number') return Number.isInteger(value) && value > 0;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return !isNaN(parsed) && parsed > 0 && String(parsed) === value;
  }
  return false;
}

// ─── Request Validators ───

export interface CreateUrlInput {
  long_url: string;
  custom_alias?: string;
  expiry_date?: string;
}

/**
 * Validates the body of a POST /urls request.
 * Returns null on success, or a NextResponse with the validation error.
 */
export function validateCreateUrl(body: any): NextResponse | null {
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
  }

  // Normalize camelCase to snake_case for backward compatibility
  if (body.longUrl && !body.long_url) body.long_url = body.longUrl;
  if (body.customAlias && !body.custom_alias) body.custom_alias = body.customAlias;
  if (body.expiryDate && !body.expiry_date) body.expiry_date = body.expiryDate;

  if (!body.long_url || typeof body.long_url !== 'string') {
    return NextResponse.json({ error: 'long_url is required and must be a string' }, { status: 400 });
  }

  if (!isValidUrl(body.long_url)) {
    return NextResponse.json(
      { error: 'long_url must be a valid HTTP or HTTPS URL' },
      { status: 400 }
    );
  }

  if (body.custom_alias !== undefined) {
    if (typeof body.custom_alias === 'string' && body.custom_alias.length > 10) {
      body.custom_alias = body.custom_alias.substring(0, 10);
    }
    if (typeof body.custom_alias !== 'string' || !isValidAlias(body.custom_alias)) {
      return NextResponse.json(
        { error: 'custom_alias must be 3-10 alphanumeric or hyphen characters' },
        { status: 400 }
      );
    }
  }

  if (body.expiry_date !== undefined) {
    if (typeof body.expiry_date !== 'string' || !isValidFutureDate(body.expiry_date)) {
      return NextResponse.json(
        { error: 'expiry_date must be a valid ISO date string in the future' },
        { status: 400 }
      );
    }
  }

  return null; // Valid
}

/**
 * Validates the body of a PATCH /urls/:id (update expiry) request.
 */
export function validateUpdateExpiry(body: any): NextResponse | null {
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
  }

  if (!body.expiry_date || typeof body.expiry_date !== 'string') {
    return NextResponse.json({ error: 'expiry_date is required and must be a string' }, { status: 400 });
  }

  if (!isValidFutureDate(body.expiry_date)) {
    return NextResponse.json(
      { error: 'expiry_date must be a valid ISO date string in the future' },
      { status: 400 }
    );
  }

  return null; // Valid
}

/**
 * Validates the :id route parameter is a positive integer.
 */
export function validateIdParam(id: string): NextResponse | null {
  if (!isPositiveInt(id)) {
    return NextResponse.json({ error: 'id must be a positive integer' }, { status: 404 });
  }
  return null;
}

/**
 * Validates pagination query params.
 * Returns sanitized { page, limit, offset } or a NextResponse error.
 */
export function validatePagination(
  pageStr: string | null,
  limitStr: string | null
): { page: number; limit: number; offset: number } | NextResponse {
  const page = parseInt(pageStr || '1', 10);
  const limit = parseInt(limitStr || '10', 10);

  if (isNaN(page) || page < 1) {
    return NextResponse.json({ error: 'page must be a positive integer' }, { status: 400 });
  }
  if (isNaN(limit) || limit < 1 || limit > 100) {
    return NextResponse.json({ error: 'limit must be between 1 and 100' }, { status: 400 });
  }

  return { page, limit, offset: (page - 1) * limit };
}

/**
 * Validates the internal malware scan request body.
 */
export function validateMalwareScanBody(body: any): NextResponse | null {
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
  }

  if (!body.url_id || !isPositiveInt(body.url_id)) {
    return NextResponse.json({ error: 'url_id must be a positive integer' }, { status: 400 });
  }

  if (!body.long_url || typeof body.long_url !== 'string' || !isValidUrl(body.long_url)) {
    return NextResponse.json({ error: 'long_url must be a valid HTTP or HTTPS URL' }, { status: 400 });
  }

  return null;
}
