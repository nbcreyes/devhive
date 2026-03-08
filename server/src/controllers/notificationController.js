import Notification from '../models/Notification.js';

/**
 * GET /api/notifications
 * Returns all unread notifications for the current user.
 */
export async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({
      recipient: req.session.userId,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'username displayName avatar')
      .populate('server', 'name icon')
      .populate('channel', 'name');

    const unreadCount = await Notification.countDocuments({
      recipient: req.session.userId,
      read: false,
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/notifications/:notificationId/read
 * Marks a single notification as read.
 */
export async function markAsRead(req, res, next) {
  try {
    const { notificationId } = req.params;

    await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: req.session.userId },
      { read: true }
    );

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/notifications/read-all
 * Marks all notifications as read for the current user.
 */
export async function markAllAsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { recipient: req.session.userId, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/notifications/:notificationId
 * Deletes a single notification.
 */
export async function deleteNotification(req, res, next) {
  try {
    const { notificationId } = req.params;

    await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.session.userId,
    });

    res.json({ message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
}