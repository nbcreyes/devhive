import ServerModel from '../models/Server.js';
import Channel from '../models/Channel.js';
import Member from '../models/Member.js';

/**
 * POST /api/servers
 * Creates a new server and makes the creator the owner.
 */
export async function createServer(req, res, next) {
  try {
    const { name, description } = req.body;

    const server = await ServerModel.create({
      name,
      description,
      owner: req.session.userId,
    });

    // Add the creator as owner in the members collection
    await Member.create({
      user: req.session.userId,
      server: server._id,
      role: 'owner',
    });

    // Create a default general channel
    await Channel.create({
      name: 'general',
      type: 'text',
      server: server._id,
      position: 0,
    });

    res.status(201).json({ server });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/servers
 * Returns all servers the current user is a member of.
 */
export async function getMyServers(req, res, next) {
  try {
    const memberships = await Member.find({ user: req.session.userId }).populate('server');
    const servers = memberships.map((m) => m.server);
    res.json({ servers });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/servers/:serverId
 * Returns a single server by ID if the user is a member.
 */
export async function getServer(req, res, next) {
  try {
    const { serverId } = req.params;

    const membership = await Member.findOne({
      user: req.session.userId,
      server: serverId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    const server = await ServerModel.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    res.json({ server });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/servers/invite/:inviteCode
 * Returns basic server info for an invite link preview.
 */
export async function getServerByInvite(req, res, next) {
  try {
    const { inviteCode } = req.params;

    const server = await ServerModel.findOne({ inviteCode }).populate('owner', 'username avatar');
    if (!server) {
      return res.status(404).json({ error: 'Invalid invite link' });
    }

    const memberCount = await Member.countDocuments({ server: server._id });

    res.json({
      server: {
        id: server._id,
        name: server.name,
        description: server.description,
        icon: server.icon,
        owner: server.owner,
        memberCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/servers/invite/:inviteCode/join
 * Joins a server using an invite code.
 */
export async function joinServer(req, res, next) {
  try {
    const { inviteCode } = req.params;

    const server = await ServerModel.findOne({ inviteCode });
    if (!server) {
      return res.status(404).json({ error: 'Invalid invite link' });
    }

    const existingMember = await Member.findOne({
      user: req.session.userId,
      server: server._id,
    });

    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this server' });
    }

    await Member.create({
      user: req.session.userId,
      server: server._id,
      role: 'member',
    });

    res.json({ server });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/servers/:serverId
 * Deletes a server — only the owner can do this.
 */
export async function deleteServer(req, res, next) {
  try {
    const { serverId } = req.params;

    const server = await ServerModel.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (server.owner.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Only the server owner can delete it' });
    }

    await ServerModel.findByIdAndDelete(serverId);
    await Member.deleteMany({ server: serverId });
    await Channel.deleteMany({ server: serverId });

    res.json({ message: 'Server deleted successfully' });
  } catch (err) {
    next(err);
  }
}