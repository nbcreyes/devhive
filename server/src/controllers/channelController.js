import Channel from '../models/Channel.js';
import Member from '../models/Member.js';

/**
 * POST /api/servers/:serverId/channels
 * Creates a new channel in a server — only owner and admins can do this.
 */
export async function createChannel(req, res, next) {
  try {
    const { serverId } = req.params;
    const { name, type, topic } = req.body;

    const membership = await Member.findOne({
      user: req.session.userId,
      server: serverId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    if (membership.role === 'member') {
      return res.status(403).json({ error: 'Only admins and owners can create channels' });
    }

    const channelCount = await Channel.countDocuments({ server: serverId });

    const channel = await Channel.create({
      name,
      type: type || 'text',
      topic: topic || '',
      server: serverId,
      position: channelCount,
    });

    res.status(201).json({ channel });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/servers/:serverId/channels
 * Returns all channels in a server the user is a member of.
 */
export async function getChannels(req, res, next) {
  try {
    const { serverId } = req.params;

    const membership = await Member.findOne({
      user: req.session.userId,
      server: serverId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    const channels = await Channel.find({ server: serverId }).sort({ position: 1 });

    res.json({ channels });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/servers/:serverId/channels/:channelId
 * Updates a channel — only owner and admins can do this.
 */
export async function updateChannel(req, res, next) {
  try {
    const { serverId, channelId } = req.params;
    const { name, topic } = req.body;

    const membership = await Member.findOne({
      user: req.session.userId,
      server: serverId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    if (membership.role === 'member') {
      return res.status(403).json({ error: 'Only admins and owners can update channels' });
    }

    const channel = await Channel.findByIdAndUpdate(
      channelId,
      { name, topic },
      { new: true }
    );

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ channel });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/servers/:serverId/channels/:channelId
 * Deletes a channel — only owner and admins can do this.
 */
export async function deleteChannel(req, res, next) {
  try {
    const { serverId, channelId } = req.params;

    const membership = await Member.findOne({
      user: req.session.userId,
      server: serverId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    if (membership.role === 'member') {
      return res.status(403).json({ error: 'Only admins and owners can delete channels' });
    }

    const channel = await Channel.findByIdAndDelete(channelId);

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ message: 'Channel deleted successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/servers/:serverId/members
 * Returns all members of a server.
 */
export async function getMembers(req, res, next) {
  try {
    const { serverId } = req.params;

    const membership = await Member.findOne({
      user: req.session.userId,
      server: serverId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    const members = await Member.find({ server: serverId }).populate(
      'user',
      'username displayName avatar status lastSeen'
    );

    res.json({ members });
  } catch (err) {
    next(err);
  }
}