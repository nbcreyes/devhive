import User from '../models/User.js';
import Member from '../models/Member.js';
import Message from '../models/Message.js';

/**
 * GET /api/users/:userId
 * Returns a user's public profile.
 */
export async function getUserProfile(req, res, next) {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      '-password -verificationToken -githubId'
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the number of servers the user is in
    const serverCount = await Member.countDocuments({ user: userId });

    // Get recent message count as activity indicator
    const messageCount = await Message.countDocuments({ author: userId });

    res.json({
      user: {
        ...user.toObject(),
        serverCount,
        messageCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/me
 * Updates the current user's profile.
 */
export async function updateProfile(req, res, next) {
  try {
    const { displayName, bio, techStack } = req.body;
    const userId = req.session.userId;

    const updated = await User.findByIdAndUpdate(
      userId,
      { displayName, bio, techStack },
      { new: true }
    ).select('-password -verificationToken');

    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/me/avatar
 * Updates the current user's avatar URL.
 * The actual file upload is handled by Cloudinary on the frontend.
 */
export async function updateAvatar(req, res, next) {
  try {
    const { avatarUrl } = req.body;
    const userId = req.session.userId;

    const updated = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password -verificationToken');

    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/me/servers
 * Returns all servers the current user is a member of with their role.
 */
export async function getMyServers(req, res, next) {
  try {
    const memberships = await Member.find({ user: req.session.userId })
      .populate('server')
      .sort({ joinedAt: -1 });

    const servers = memberships.map((m) => ({
      ...m.server.toObject(),
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    res.json({ servers });
  } catch (err) {
    next(err);
  }
}