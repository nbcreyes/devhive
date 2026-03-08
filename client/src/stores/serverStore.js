import { create } from 'zustand';
import api from '@/lib/api';

/**
 * Global store for servers and channels using Zustand.
 */
const useServerStore = create((set, get) => ({
  servers: [],
  currentServer: null,
  channels: [],
  currentChannel: null,
  members: [],
  isLoading: false,

  /**
   * Fetches all servers the current user is a member of.
   */
  fetchServers: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/servers');
      set({ servers: res.data.servers, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  /**
   * Sets the current active server and fetches its channels and members.
   * @param {string} serverId
   */
  setCurrentServer: async (serverId) => {
    const server = get().servers.find((s) => s._id === serverId);
    set({ currentServer: server });

    try {
      const [channelsRes, membersRes] = await Promise.all([
        api.get(`/servers/${serverId}/channels`),
        api.get(`/servers/${serverId}/members`),
      ]);
      set({
        channels: channelsRes.data.channels,
        members: membersRes.data.members,
      });
    } catch (err) {
      console.error('[serverStore] failed to load server data:', err.message);
    }
  },

  /**
   * Sets the current active channel.
   * @param {object} channel
   */
  setCurrentChannel: (channel) => {
    set({ currentChannel: channel });
  },

  /**
   * Adds a newly created server to the list.
   * @param {object} server
   */
  addServer: (server) => {
    set((state) => ({ servers: [...state.servers, server] }));
  },

  /**
   * Adds a newly created channel to the list.
   * @param {object} channel
   */
  addChannel: (channel) => {
    set((state) => ({ channels: [...state.channels, channel] }));
  },
}));

export default useServerStore;