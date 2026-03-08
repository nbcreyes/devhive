import redis from '../config/redis.js';
import User from '../models/User.js';

/**
 * Sets a user's presence status in Redis and MongoDB.
 * Redis stores the status with a TTL for automatic expiry.
 *
 * @param {string} userId
 * @param {'online' | 'idle' | 'offline'} status
 */
export async function setPresence(userId, status) {
  if (status === 'offline') {
    await redis.del(`presence:${userId}`);
  } else {
    // Presence expires after 5 minutes — client must keep sending heartbeats
    await redis.set(`presence:${userId}`, status, { ex: 300 });
  }

  await User.findByIdAndUpdate(userId, {
    status,
    lastSeen: new Date(),
  });
}

/**
 * Gets a user's current presence status from Redis.
 * Falls back to offline if not found.
 *
 * @param {string} userId
 * @returns {Promise<'online' | 'idle' | 'offline'>}
 */
export async function getPresence(userId) {
  const status = await redis.get(`presence:${userId}`);
  return status || 'offline';
}

/**
 * Gets presence status for multiple users at once.
 *
 * @param {string[]} userIds
 * @returns {Promise<Record<string, 'online' | 'idle' | 'offline'>>}
 */
export async function getBulkPresence(userIds) {
  const presence = {};

  await Promise.all(
    userIds.map(async (userId) => {
      presence[userId] = await getPresence(userId);
    })
  );

  return presence;
}