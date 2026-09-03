import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Hashes a password using Node.js crypto scrypt.
 * Returns the hash and salt in a single string: salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString('hex')}`;
}

/**
 * Compares a plain text password with a stored hash (salt:hash).
 */
export async function comparePassword(
  password: string,
  storedValue: string
): Promise<boolean> {
  const [salt, hash] = storedValue.split(':');
  const hashBuffer = Buffer.from(hash, 'hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(hashBuffer, buf);
}

/**
 * Generates a random secure password for new users.
 */
export function generateRandomPassword(length: number = 12): string {
  return randomBytes(length).toString('base64').slice(0, length);
}
