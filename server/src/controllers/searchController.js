import Message from '../models/Message.js';
import User from '../models/User.js';
import ServerModel from '../models/Server.js';
import Member from '../models/Member.js';

/**
 * GET /api/search
 * Searches across messages, users, and servers.
 * Query params: q (search term), type (messages|users|servers|all)
 */
export async function search(req, res, next) {
  try {
    const { q, type = 'all' } = req.query;
    const userId = req.session.userId;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    if (q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const results = {};

    // Search messages — only in servers the user is a member of
    if (type === 'all' || type === 'messages') {
      const memberships = await Member.find({ user: userId }).select('server');
      const serverIds = memberships.map((m) => m.server);

      const messages = await Message.find({
        $text: { $search: q },
        server: { $in: serverIds },
        isDeleted: false,
      })
        .limit(20)
        .populate('author', 'username displayName avatar')
        .populate('channel', 'name')
        .populate('server', 'name');

      results.messages = messages;
    }

    // Search users
    if (type === 'all' || type === 'users') {
      const users = await User.find({
        $text: { $search: q },
        isVerified: true,
      })
        .limit(10)
        .select('username displayName avatar bio techStack status');

      results.users = users;
    }

    // Search servers — only public ones or ones the user is already in
    if (type === 'all' || type === 'servers') {
      const memberships = await Member.find({ user: userId }).select('server');
      const memberServerIds = memberships.map((m) => m.server.toString());

      const servers = await ServerModel.find({
        $text: { $search: q },
        $or: [
          { isPublic: true },
          { _id: { $in: memberServerIds } },
        ],
      })
        .limit(10)
        .populate('owner', 'username displayName avatar');

      results.servers = servers;
    }

    res.json({ results, query: q });
  } catch (err) {
    next(err);
  }
}