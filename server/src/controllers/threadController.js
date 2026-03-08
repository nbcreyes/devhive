import Thread from '../models/Thread.js';
import Message from '../models/Message.js';
import Member from '../models/Member.js';
import Channel from '../models/Channel.js';

/**
 * GET /api/messages/:messageId/threads
 * Returns all thread replies for a message.
 */
export async function getThreads(req, res, next) {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const membership = await Member.findOne({
      user: req.session.userId,
      server: message.server,
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    const threads = await Thread.find({
      parentMessage: messageId,
      isDeleted: false,
    })
      .sort({ createdAt: 1 })
      .populate('author', 'username displayName avatar');

    res.json({ threads });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/messages/:messageId/threads
 * Creates a new thread reply on a message.
 */
export async function createThread(req, res, next) {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const membership = await Member.findOne({
      user: req.session.userId,
      server: message.server,
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    const thread = await Thread.create({
      content,
      author: req.session.userId,
      parentMessage: messageId,
      channel: message.channel,
      server: message.server,
    });

    // Increment the thread count on the parent message
    await Message.findByIdAndUpdate(messageId, { $inc: { threadCount: 1 } });

    const populated = await Thread.findById(thread._id).populate(
      'author',
      'username displayName avatar'
    );

    res.status(201).json({ thread: populated });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/messages/:messageId/threads/:threadId
 * Edits a thread reply — only the author can do this.
 */
export async function editThread(req, res, next) {
  try {
    const { threadId } = req.params;
    const { content } = req.body;

    const thread = await Thread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Thread reply not found' });
    }

    if (thread.author.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'You can only edit your own replies' });
    }

    const updated = await Thread.findByIdAndUpdate(
      threadId,
      { content, isEdited: true },
      { new: true }
    ).populate('author', 'username displayName avatar');

    res.json({ thread: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/messages/:messageId/threads/:threadId
 * Soft deletes a thread reply — only the author or admins can do this.
 */
export async function deleteThread(req, res, next) {
  try {
    const { messageId, threadId } = req.params;

    const thread = await Thread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Thread reply not found' });
    }

    const membership = await Member.findOne({
      user: req.session.userId,
      server: thread.server,
    });

    const isAuthor = thread.author.toString() === req.session.userId;
    const isAdmin = membership && (membership.role === 'admin' || membership.role === 'owner');

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own replies' });
    }

    await Thread.findByIdAndUpdate(threadId, {
      isDeleted: true,
      content: 'This reply was deleted',
    });

    await Message.findByIdAndUpdate(messageId, { $inc: { threadCount: -1 } });

    res.json({ message: 'Reply deleted successfully' });
  } catch (err) {
    next(err);
  }
}