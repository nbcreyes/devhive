import Member from '../models/Member.js';
import Channel from '../models/Channel.js';
import redis from '../config/redis.js';

/**
 * Registers Socket.io event handlers for the live collaborative code editor.
 * Editor state is stored in Redis so it persists across reconnections.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerEditorHandlers(io, socket) {
  /**
   * Join an editor session for a code channel.
   * Sends the current editor state to the joining user.
   */
  socket.on('editor:join', async (channelId) => {
    try {
      const userId = socket.data.userId;

      const channel = await Channel.findById(channelId);
      if (!channel || channel.type !== 'code') {
        return socket.emit('error', { message: 'This is not a code channel' });
      }

      const membership = await Member.findOne({
        user: userId,
        server: channel.server,
      });

      if (!membership) {
        return socket.emit('error', { message: 'You are not a member of this server' });
      }

      socket.join(`editor:${channelId}`);

      // Send current editor content to the joining user
      const content = await redis.get(`editor:${channelId}:content`);
      const language = await redis.get(`editor:${channelId}:language`);

      socket.emit('editor:init', {
        content: content || '',
        language: language || 'javascript',
      });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  /**
   * Leave an editor session.
   */
  socket.on('editor:leave', (channelId) => {
    socket.leave(`editor:${channelId}`);
    socket.to(`editor:${channelId}`).emit('editor:cursorRemoved', {
      userId: socket.data.userId,
    });
  });

  /**
   * Broadcast a content change to all users in the editor session.
   * Also saves the latest content to Redis.
   */
  socket.on('editor:change', async (data) => {
    try {
      const { channelId, content } = data;
      const userId = socket.data.userId;

      // Save latest content to Redis with a 24 hour expiry
      await redis.set(`editor:${channelId}:content`, content, { ex: 86400 });

      socket.to(`editor:${channelId}`).emit('editor:changed', {
        content,
        userId,
      });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  /**
   * Broadcast a language change to all users in the editor session.
   */
  socket.on('editor:languageChange', async (data) => {
    try {
      const { channelId, language } = data;

      await redis.set(`editor:${channelId}:language`, language, { ex: 86400 });

      socket.to(`editor:${channelId}`).emit('editor:languageChanged', {
        language,
        userId: socket.data.userId,
      });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  /**
   * Broadcast cursor position to other users in the editor session.
   */
  socket.on('editor:cursor', (data) => {
    const { channelId, position, selection } = data;
    const userId = socket.data.userId;

    socket.to(`editor:${channelId}`).emit('editor:cursorMoved', {
      userId,
      position,
      selection,
    });
  });
}