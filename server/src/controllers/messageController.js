import Message from "../models/Message.js";
import Member from "../models/Member.js";
import Channel from "../models/Channel.js";
import { parseCodeBlock } from "../utils/codeDetector.js";

/**
 * GET /api/channels/:channelId/messages
 * Returns paginated messages for a channel using cursor-based pagination.
 * Cursor is the ID of the oldest message already loaded on the client.
 */
export async function getMessages(req, res, next) {
  try {
    const { channelId } = req.params;
    const { cursor, limit = 50 } = req.query;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const membership = await Member.findOne({
      user: req.session.userId,
      server: channel.server,
    });

    if (!membership) {
      return res
        .status(403)
        .json({ error: "You are not a member of this server" });
    }

    const query = { channel: channelId, isDeleted: false };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(Number(limit))
      .populate("author", "username displayName avatar");

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
 * DELETE /api/channels/:channelId/messages/:messageId
 * Soft deletes a message — only the author or admins can do this.
 */
export async function deleteMessage(req, res, next) {
  try {
    const { channelId, messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const membership = await Member.findOne({
      user: req.session.userId,
      server: message.server,
    });

    if (!membership) {
      return res
        .status(403)
        .json({ error: "You are not a member of this server" });
    }

    const isAuthor = message.author.toString() === req.session.userId;
    const isAdmin = membership.role === "admin" || membership.role === "owner";

    if (!isAuthor && !isAdmin) {
      return res
        .status(403)
        .json({ error: "You can only delete your own messages" });
    }

    await Message.findByIdAndUpdate(messageId, {
      isDeleted: true,
      content: "This message was deleted",
    });

    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/channels/:channelId/messages/:messageId
 * Edits a message — only the author can do this.
 */
export async function editMessage(req, res, next) {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.author.toString() !== req.session.userId) {
      return res
        .status(403)
        .json({ error: "You can only edit your own messages" });
    }

    const { isCode: detectedCode, language } = parseCodeBlock(content.trim());

    const updated = await Message.findByIdAndUpdate(
      messageId,
      {
        content,
        isEdited: true,
        isCode: detectedCode,
        codeLanguage: language || null,
      },
      { new: true },
    ).populate("author", "username displayName avatar");

    res.json({ message: updated });
  } catch (err) {
    next(err);
  }
}
