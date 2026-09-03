import { SignJWT, jwtVerify } from 'jose';

const AUTH_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

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
