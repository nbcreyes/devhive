import { create } from 'zustand';
import api from '@/lib/api';

/**
 * Global store for notifications using Zustand.
 */
const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  /**
   * Fetches all notifications for the current user.
   */
  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      set({
        notifications: res.data.notifications,
        unreadCount: res.data.unreadCount,
      });
    } catch (err) {
      console.error('[notificationStore] failed to fetch:', err.message);
    }
  },

  /**
   * Adds a new notification received via Socket.io.
   * @param {object} notification
   */
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  /**
   * Marks a single notification as read.
   * @param {string} notificationId
   */
  markAsRead: async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error('[notificationStore] failed to mark as read:', err.message);
    }
  },

  /**
   * Marks all notifications as read.
   */
  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('[notificationStore] failed to mark all as read:', err.message);
    }
  },
}));

export default useNotificationStore;