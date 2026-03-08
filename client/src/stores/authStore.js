import { create } from "zustand";
import api from "@/lib/api";

/**
 * Global auth store using Zustand.
 * Manages the current user session across the app.
 */
const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // start as true

  /**
   * Fetches the current session from the server.
   * Called once on app load to restore the session.
   */
  fetchMe: async () => {
    try {
      const res = await api.get("/auth/me");
      const user = res.data.user;
      set({
        user: { ...user, id: user._id || user.id },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  /**
   * Logs in the user and stores the session.
   * @param {string} email
   * @param {string} password
   */
  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const user = res.data.user;
    set({ user: { ...user, id: user._id || user.id }, isAuthenticated: true });
    return user;
  },

  /**
   * Registers a new user.
   * @param {string} username
   * @param {string} email
   * @param {string} password
   */
  register: async (username, email, password) => {
    const res = await api.post("/auth/register", { username, email, password });
    return res.data;
  },

  /**
   * Logs out the user and clears the session.
   */
  logout: async () => {
    await api.post("/auth/logout");
    set({ user: null, isAuthenticated: false });
  },

  /**
   * Updates the current user in the store after a profile update.
   * @param {object} updates
   */
  updateUser: (updates) => {
    set((state) => ({ user: { ...state.user, ...updates } }));
  },
}));

export default useAuthStore;
