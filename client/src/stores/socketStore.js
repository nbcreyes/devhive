import { create } from 'zustand';
import { io } from 'socket.io-client';

/**
 * Global Socket.io store using Zustand.
 * Manages a single shared socket connection across the app.
 */
const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,

  /**
   * Connects to the Socket.io server with the current user's ID.
   * @param {string} userId
   */
  connect: (userId) => {
    const existing = get().socket;
    if (existing) return;

    const socket = io('/', {
      auth: { userId },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    set({ socket });
  },

  /**
   * Disconnects the socket and clears the store.
   */
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));

export default useSocketStore;