import { setPresence, getBulkPresence } from '../services/presence.js';
import Member from '../models/Member.js';

/**
 * Registers Socket.io event handlers for online presence indicators.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerPresenceHandlers(io, socket) {
  const userId = socket.data.userId;

  /**
   * Mark the user as online when they connect.
   * Broadcast their status to all servers they are in.
   */
  async function goOnline() {
    try {
      await setPresence(userId, 'online');

      const memberships = await Member.find({ user: userId }).select('server');
      for (const membership of memberships) {
        socket.to(`server:${membership.server}`).emit('presence:update', {
          userId,
          status: 'online',
        });
      }
    } catch (err) {
      console.error('[presence] goOnline error:', err.message);
    }
  }

  goOnline();

  /**
   * Join a server room to receive presence updates from members.
   */
  socket.on('server:join', async (serverId) => {
    socket.join(`server:${serverId}`);

    // Send current presence of all members in this server
    const memberships = await Member.find({ server: serverId }).select('user');
    const userIds = memberships.map((m) => m.user.toString());
    const presence = await getBulkPresence(userIds);

    socket.emit('presence:bulk', { presence });
  });

  /**
   * Leave a server room.
   */
  socket.on('server:leave', (serverId) => {
    socket.leave(`server:${serverId}`);
  });

  /**
   * Handle heartbeat — keeps the user marked as online.
   * Client should send this every 60 seconds.
   */
  socket.on('presence:heartbeat', async () => {
    try {
      await setPresence(userId, 'online');
    } catch (err) {
      console.error('[presence] heartbeat error:', err.message);
    }
  });

  /**
   * Handle idle status — user has been inactive.
   */
  socket.on('presence:idle', async () => {
    try {
      await setPresence(userId, 'idle');

      const memberships = await Member.find({ user: userId }).select('server');
      for (const membership of memberships) {
        socket.to(`server:${membership.server}`).emit('presence:update', {
          userId,
          status: 'idle',
        });
      }
    } catch (err) {
      console.error('[presence] idle error:', err.message);
    }
  });

  /**
   * Mark the user as offline when they disconnect.
   */
  socket.on('disconnect', async () => {
    try {
      await setPresence(userId, 'offline');

      const memberships = await Member.find({ user: userId }).select('server');
      for (const membership of memberships) {
        io.to(`server:${membership.server}`).emit('presence:update', {
          userId,
          status: 'offline',
        });
      }
    } catch (err) {
      console.error('[presence] disconnect error:', err.message);
    }
  });
}