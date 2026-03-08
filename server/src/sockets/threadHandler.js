import Thread from '../models/Thread.js';
import Message from '../models/Message.js';
import Member from '../models/Member.js';

/**
 * Registers Socket.io event handlers for real-time thread replies.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerThreadHandlers(io, socket) {
  /**
   * Join a thread room to receive replies for a specific message.
   */
  socket.on('thread:join', (messageId) => {
    socket.join(`thread:${messageId}`);
  });

  /**
   * Leave a thread room.
   */
  socket.on('thread:leave', (messageId) => {
    socket.leave(`thread:${messageId}`);
  });

  /**
   * Send a thread reply.
   * Saves to DB and broadcasts to the thread room.
   */
  socket.on('thread:send', async (data) => {
    try {
      const { messageId, content } = data;
      const userId = socket.data.userId;

      if (!content || content.trim().length === 0) {
        return socket.emit('error', { message: 'Reply content cannot be empty' });
      }

      if (content.length > 4000) {
        return socket.emit('error', { message: 'Reply is too long' });
      }

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      const membership = await Member.findOne({
        user: userId,
        server: message.server,
      });

      if (!membership) {
        return socket.emit('error', { message: 'You are not a member of this server' });
      }

      const thread = await Thread.create({
        content: content.trim(),
        author: userId,
        parentMessage: messageId,
        channel: message.channel,
        server: message.server,
      });

      await Message.findByIdAndUpdate(messageId, { $inc: { threadCount: 1 } });

      const populated = await Thread.findById(thread._id).populate(
        'author',
        'username displayName avatar'
      );

      // Emit to the thread room
      io.to(`thread:${messageId}`).emit('thread:new', { thread: populated });

      // Also update the thread count in the channel room
      io.to(`channel:${message.channel}`).emit('message:threadCountUpdated', {
        messageId,
        threadCount: message.threadCount + 1,
      });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  /**
   * Broadcast a thread reply edit.
   */
  socket.on('thread:edit', async (data) => {
    try {
      const { threadId, content } = data;
      const userId = socket.data.userId;

      const thread = await Thread.findById(threadId);
      if (!thread) {
        return socket.emit('error', { message: 'Thread reply not found' });
      }

      if (thread.author.toString() !== userId) {
        return socket.emit('error', { message: 'You can only edit your own replies' });
      }

      const updated = await Thread.findByIdAndUpdate(
        threadId,
        { content, isEdited: true },
        { new: true }
      ).populate('author', 'username displayName avatar');

      io.to(`thread:${thread.parentMessage}`).emit('thread:updated', { thread: updated });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  /**
   * Broadcast a thread reply deletion.
   */
  socket.on('thread:delete', async (data) => {
    try {
      const { threadId, messageId } = data;
      const userId = socket.data.userId;

      const thread = await Thread.findById(threadId);
      if (!thread) {
        return socket.emit('error', { message: 'Thread reply not found' });
      }

      const membership = await Member.findOne({
        user: userId,
        server: thread.server,
      });

      const isAuthor = thread.author.toString() === userId;
      const isAdmin = membership && (membership.role === 'admin' || membership.role === 'owner');

      if (!isAuthor && !isAdmin) {
        return socket.emit('error', { message: 'You can only delete your own replies' });
      }

      await Thread.findByIdAndUpdate(threadId, {
        isDeleted: true,
        content: 'This reply was deleted',
      });

      await Message.findByIdAndUpdate(messageId, { $inc: { threadCount: -1 } });

      io.to(`thread:${messageId}`).emit('thread:deleted', { threadId });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });
}