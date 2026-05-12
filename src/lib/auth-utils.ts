import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { SignJWT, jwtVerify } from 'jose';

const scryptAsync = promisify(scrypt);
const AUTH_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

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

/**
 * Signs a JWT token for a user.
 */
export async function signToken(payload: {
  userId: string;
  email: string;
  role: string;
}) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(AUTH_SECRET);
}

/**
 * Verifies a JWT token.
 */
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, AUTH_SECRET);
    return payload as { userId: string; email: string; role: string };
  } catch (_) {
    return null;
  }
}
