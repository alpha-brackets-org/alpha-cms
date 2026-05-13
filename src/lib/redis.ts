import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL!;

// Create a singleton Redis instance
let redis: Redis | undefined;

export function getRedisInstance(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null, // Required for BullMQ
    });
  }
  return redis;
}

export const redisConnection = {
  host: process.env.REDIS_HOST!,
  port: parseInt(process.env.REDIS_PORT!),
  maxRetriesPerRequest: null, // Required for BullMQ
};
