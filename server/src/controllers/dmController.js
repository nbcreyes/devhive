import DirectMessage from '../models/DirectMessage.js';
import User from '../models/User.js';

/**
 * GET /api/dm/:userId
 * Returns paginated direct messages between the current user and another user.
 */
export async function getDirectMessages(req, res, next) {
  try {
    const { userId } = req.params;
    const { cursor, limit = 50 } = req.query;
    const currentUserId = req.session.userId;

    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const query = {
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId },
      ],
      isDeleted: false,
    };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const messages = await DirectMessage.find(query)
      .sort({ _id: -1 })
      .limit(Number(limit))
      .populate('sender', 'username displayName avatar')
      .populate('recipient', 'username displayName avatar');

    const hasMore = messages.length === Number(limit);

    res.json({
      messages: messages.reverse(),
      hasMore,
      nextCursor: hasMore ? messages[0]._id : null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dm/conversations
 * Returns a list of all users the current user has had DMs with.
 */
export async function getConversations(req, res, next) {
  try {
    const currentUserId = req.session.userId;

    const messages = await DirectMessage.find({
      $or: [
        { sender: currentUserId },
        { recipient: currentUserId },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username displayName avatar status')
      .populate('recipient', 'username displayName avatar status');

    // Build a unique list of conversations
    const seen = new Set();
    const conversations = [];

    for (const msg of messages) {
      const otherId =
        msg.sender._id.toString() === currentUserId
          ? msg.recipient._id.toString()
          : msg.sender._id.toString();

      if (!seen.has(otherId)) {
        seen.add(otherId);
        const otherUser =
          msg.sender._id.toString() === currentUserId ? msg.recipient : msg.sender;
        conversations.push({
          user: otherUser,
          lastMessage: {
            content: msg.isDeleted ? 'This message was deleted' : msg.content,
            createdAt: msg.createdAt,
          },
        });
      }
    }

    res.json({ conversations });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/dm/:messageId
 * Soft deletes a direct message — only the sender can do this.
 */
export async function deleteDirectMessage(req, res, next) {
  try {
    const { messageId } = req.params;
    const currentUserId = req.session.userId;

    const message = await DirectMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await DirectMessage.findByIdAndUpdate(messageId, {
      isDeleted: true,
      content: 'This message was deleted',
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/dm/:messageId
 * Edits a direct message — only the sender can do this.
 */
export async function editDirectMessage(req, res, next) {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const currentUserId = req.session.userId;

    const message = await DirectMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    const updated = await DirectMessage.findByIdAndUpdate(
      messageId,
      { content, isEdited: true },
      { new: true }
    )
      .populate('sender', 'username displayName avatar')
      .populate('recipient', 'username displayName avatar');

    res.json({ message: updated });
  } catch (err) {
    next(err);
  }
}