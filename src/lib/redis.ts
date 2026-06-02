import Redis from 'ioredis';

const DEFAULT_REDIS = 'redis://127.0.0.1:6379';
const REDIS_URL = process.env.REDIS_URL || DEFAULT_REDIS;

// Parse host/port once from REDIS_URL so both the singleton and BullMQ
// use the same source of truth — no more dual REDIS_HOST/REDIS_PORT vars.
const parsedUrl = new URL(REDIS_URL);

// Create a singleton Redis instance
let redis: Redis | undefined;

export function getRedisInstance(): Redis {
  if (!process.env.REDIS_URL) {
    throw new Error('[alpha-cms] REDIS_URL environment variable is required but not set.');
  }

  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null, // Required for BullMQ
    });

    redis.on('error', (err: Error) => {
      console.error('[Redis] Connection error:', err.message);
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected');
    });
  }
  return redis;
}

// Derived from REDIS_URL — single source of truth for BullMQ workers
export const redisConnection = {
  get host() {
    if (!process.env.REDIS_URL) {
      throw new Error('[alpha-cms] REDIS_URL environment variable is required but not set.');
    }
    return parsedUrl.hostname;
  },
  get port() {
    if (!process.env.REDIS_URL) {
      throw new Error('[alpha-cms] REDIS_URL environment variable is required but not set.');
    }
    return parseInt(parsedUrl.port || '6379', 10);
  },
  maxRetriesPerRequest: null, // Required for BullMQ
};
