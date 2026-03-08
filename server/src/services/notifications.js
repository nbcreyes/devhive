import Notification from '../models/Notification.js';
import { getIO } from '../config/socket.js';

/**
 * Creates a notification and emits it to the recipient via Socket.io.
 *
 * @param {{
 *   recipient: string,
 *   type: 'mention' | 'direct_message' | 'server_invite' | 'thread_reply',
 *   sender: string,
 *   server?: string,
 *   channel?: string,
 *   message?: string,
 *   preview?: string
 * }} options
 */
export async function createNotification(options) {
  const { recipient, type, sender, server, channel, message, preview } = options;

  // Don't notify users about their own actions
  if (recipient.toString() === sender.toString()) return;

  const notification = await Notification.create({
    recipient,
    type,
    sender,
    server: server || null,
    channel: channel || null,
    message: message || null,
    preview: preview || '',
  });

  const populated = await Notification.findById(notification._id)
    .populate('sender', 'username displayName avatar')
    .populate('server', 'name icon')
    .populate('channel', 'name');

  // Emit the notification to the recipient in real time
  try {
    const io = getIO();
    io.to(`user:${recipient}`).emit('notification:new', { notification: populated });
  } catch {
    // Socket.io may not be initialized in tests
  }

  return populated;
}

/**
 * Parses a message content string and returns an array of mentioned user IDs.
 * Mentions follow the format @username.
 *
 * @param {string} content - Message content
 * @param {import('mongoose').Model} UserModel - Mongoose User model
 * @returns {Promise<string[]>} Array of user IDs
 */
export async function extractMentions(content, UserModel) {
  const mentionRegex = /@(\w+)/g;
  const matches = [...content.matchAll(mentionRegex)];

  if (matches.length === 0) return [];

  const usernames = matches.map((m) => m[1]);
  const users = await UserModel.find({ username: { $in: usernames } }).select('_id');

  return users.map((u) => u._id.toString());
}