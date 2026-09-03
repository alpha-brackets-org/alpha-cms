import { getRedisInstance } from '@/lib/redis';

const CHECK_TIMEOUT_MS = 300;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('rate-limit-timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Sliding-window-ish rate limiter over the shared Redis instance
 * (src/lib/redis.ts — same connection BullMQ already uses).
 *
 * Fails OPEN (allows the request) if Redis is unreachable or slow, rather
 * than turning a Redis outage into an outage for every public write route.
 * This is a defense-in-depth backstop, not the sole line of defense.
 */
export async function checkRateLimit(
  route: string,
  identifier: string,
  limit: number,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const redis = getRedisInstance();
    const key = `ratelimit:${route}:${identifier}`;
    const count = await withTimeout(redis.incr(key), CHECK_TIMEOUT_MS);
    if (count === 1) {
      await withTimeout(redis.expire(key, windowSeconds), CHECK_TIMEOUT_MS);
    }
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  } catch (err) {
    console.error(
      '[rate-limit] Redis unavailable, failing open:',
      err instanceof Error ? err.message : err
    );
    return { allowed: true, remaining: limit };
  }
}

/** Best-effort client IP extraction for serverless/proxy environments. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
