import { create } from 'zustand';

const useStore = create((set) => ({
  // Auth
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => {
    localStorage.setItem('sf_token', token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('sf_token');
    set({ user: null, token: null, isAuthenticated: false, cvProfile: null });
  },
  updateUser: (user) => set({ user }),

  // Notifications
  notifications: [],
  setNotifications: (notifs) => set({ notifications: notifs }),
  addNotification: (n) =>
    set((s) => ({
      notifications: [
        {
          id: Math.random().toString(36).substring(7),
          read: false,
          timestamp: new Date().toISOString(),
          ...n,
        },
        ...s.notifications,
      ],
    })),
  markAllNotificationsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
  clearNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),

  // CV
  cvProfile: null,
  setCVProfile: (cv) => set({ cvProfile: cv }),

  // Applications
  applications: [],
  setApplications: (apps) => set({ applications: apps }),
  addApplication: (app) =>
    set((s) => ({ applications: [app, ...s.applications] })),
  updateApplication: (id, changes) =>
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === id ? { ...a, ...changes } : a
      ),
    })),

  // UI state
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

export default useStore;
