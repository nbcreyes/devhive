import Message from '../models/Message.js';
import Member from '../models/Member.js';
import Channel from '../models/Channel.js';
import User from '../models/User.js';

/**
 * Registers Socket.io event handlers for real-time messaging.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerMessageHandlers(io, socket) {
  /**
   * Join a channel room to receive messages from it.
   * The client calls this when navigating to a channel.
   */
  socket.on('channel:join', async (channelId) => {
    try {
      socket.join(`channel:${channelId}`);
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  /**
   * Leave a channel room.
   * The client calls this when navigating away from a channel.
   */
  socket.on('channel:leave', (channelId) => {
    socket.leave(`channel:${channelId}`);
  });

  /**
   * Send a message to a channel.
   * Validates membership, saves to DB, and broadcasts to the channel room.
   */
  socket.on('message:send', async (data) => {
    try {
      const { channelId, content, isCode, codeLanguage } = data;
      const userId = socket.data.userId;

      if (!userId) {
        return socket.emit('error', { message: 'Not authenticated' });
      }

      if (!content || content.trim().length === 0) {
        return socket.emit('error', { message: 'Message content cannot be empty' });
      }

      if (content.length > 4000) {
        return socket.emit('error', { message: 'Message is too long' });
      }

      const channel = await Channel.findById(channelId);
      if (!channel) {
        return socket.emit('error', { message: 'Channel not found' });
      }

      const membership = await Member.findOne({
        user: userId,
        server: channel.server,
      });

      if (!membership) {
        return socket.emit('error', { message: 'You are not a member of this server' });
      }

      const message = await Message.create({
        content: content.trim(),
        author: userId,
        channel: channelId,
        server: channel.server,
        isCode: isCode || false,
        codeLanguage: codeLanguage || null,
      });

      const populated = await Message.findById(message._id).populate(
        'author',
        'username displayName avatar'
      );

      io.to(`channel:${channelId}`).emit('message:new', { message: populated });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  /**
   * Broadcast a message edit to all clients in the channel room.
   */
  socket.on('message:edit', async (data) => {
    try {
      const { messageId, content } = data;
      const userId = socket.data.userId;

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      if (message.author.toString() !== userId) {
        return socket.emit('error', { message: 'You can only edit your own messages' });
      }

      const updated = await Message.findByIdAndUpdate(
        messageId,
        { content, isEdited: true },
        { new: true }
      ).populate('author', 'username displayName avatar');

      io.to(`channel:${updated.channel}`).emit('message:updated', { message: updated });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  /**
   * Broadcast a message deletion to all clients in the channel room.
   */
  socket.on('message:delete', async (data) => {
    try {
      const { messageId } = data;
      const userId = socket.data.userId;

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      const membership = await Member.findOne({
        user: userId,
        server: message.server,
      });

      const isAuthor = message.author.toString() === userId;
      const isAdmin = membership && (membership.role === 'admin' || membership.role === 'owner');

      if (!isAuthor && !isAdmin) {
        return socket.emit('error', { message: 'You can only delete your own messages' });
      }

      await Message.findByIdAndUpdate(messageId, {
        isDeleted: true,
        content: 'This message was deleted',
      });

      io.to(`channel:${message.channel}`).emit('message:deleted', { messageId });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  /**
   * Broadcast a typing indicator to other clients in the channel room.
   */
  socket.on('typing:start', async (data) => {
    try {
      const { channelId } = data;
      const userId = socket.data.userId;

      const user = await User.findById(userId).select('username displayName');
      if (!user) return;

      socket.to(`channel:${channelId}`).emit('typing:update', {
        userId,
        username: user.displayName || user.username,
        isTyping: true,
      });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('typing:stop', (data) => {
    const { channelId } = data;
    const userId = socket.data.userId;

    socket.to(`channel:${channelId}`).emit('typing:update', {
      userId,
      isTyping: false,
    });
  });
}