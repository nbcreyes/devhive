import Message from '../models/Message.js';
import Member from '../models/Member.js';
import Channel from '../models/Channel.js';
import { summarizeMessages } from '../services/groq.js';
import redis from '../config/redis.js';

/**
 * GET /api/channels/:channelId/summary
 * Generates an AI summary of the last 50 messages in a channel.
 * Caches the result in Redis for 10 minutes to avoid hitting the Gemini rate limit.
 */
export async function getChannelSummary(req, res, next) {
  try {
    const { channelId } = req.params;
    const userId = req.session.userId;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const membership = await Member.findOne({
      user: userId,
      server: channel.server,
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    // Check Redis cache first
    const cacheKey = `summary:${channelId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ summary: cached, cached: true });
    }

    const messages = await Message.find({
      channel: channelId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'displayName username');

    if (messages.length === 0) {
      return res.json({ summary: 'No messages to summarize yet.', cached: false });
    }

    const formatted = messages.reverse().map((m) => ({
      author: m.author.displayName || m.author.username,
      content: m.content,
      createdAt: m.createdAt,
    }));

    const summary = await summarizeMessages(formatted);

    // Cache for 10 minutes
    await redis.set(cacheKey, summary, { ex: 600 });

    res.json({ summary, cached: false });
  } catch (err) {
    next(err);
  }
}