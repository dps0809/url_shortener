import { nanoid, customAlphabet } from 'nanoid';
import { PoolClient } from 'pg';
import { shortCodeExists } from './queries/urls';

// Custom alphabet: lowercase + digits, 6 chars
const generateCode = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

const MAX_RETRIES = 5;

/**
 * Generate a unique short code.
 * Uses custom alphabet (lowercase + digits), 6 characters.
 * Retries up to MAX_RETRIES times if a collision is detected.
 */
export async function generateUniqueShortCode(client: PoolClient): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateCode();

    const exists = await shortCodeExists(client, code);
    if (!exists) {
      return code;
    }
  }

  throw new Error(
    `Failed to generate unique short code after ${MAX_RETRIES} attempts`
  );
}
