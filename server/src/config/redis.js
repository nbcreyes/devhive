import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client using REST API.
 * Works on Render free tier without a persistent TCP connection.
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Tests the Redis connection by sending a ping.
 * Logs success or failure but does not exit — Redis is not critical for startup.
 */
export async function connectRedis() {
  try {
    await redis.ping();
    console.log('[redis] connected to Upstash');
  } catch (err) {
    console.error('[redis] connection failed:', err.message);
  }
}

export default redis;