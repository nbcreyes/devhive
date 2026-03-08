import { generateVoiceToken } from '../services/livekit.js';
import Member from '../models/Member.js';
import Channel from '../models/Channel.js';
import User from '../models/User.js';

/**
 * GET /api/voice/:channelId/token
 * Generates a LiveKit token for the current user to join a voice channel.
 */
export async function getVoiceToken(req, res, next) {
  try {
    const { channelId } = req.params;
    const userId = req.session.userId;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    if (channel.type !== 'voice') {
      return res.status(400).json({ error: 'This channel is not a voice channel' });
    }

    const membership = await Member.findOne({
      user: userId,
      server: channel.server,
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    const user = await User.findById(userId).select('username displayName');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = await generateVoiceToken({
      userId,
      username: user.displayName || user.username,
      channelId,
    });

    res.json({
      token,
      url: process.env.LIVEKIT_URL,
      channelId,
    });
  } catch (err) {
    next(err);
  }
}