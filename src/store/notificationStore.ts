import { create } from 'zustand';
import { NotificationItem } from '../types/notification';
import { notificationService } from '../services/notificationService';

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (
    item: Omit<NotificationItem, 'id' | 'isRead'> & { timestamp?: string }
  ) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  addNotification: async (item) => {
    const created = await notificationService.addNotification(item);
    set((state) => {
      const next = [created, ...state.notifications];
      return {
        notifications: next,
        unreadCount: next.filter((n) => !n.isRead).length,
      };
    });
  },

  loadNotifications: async () => {
    set({ isLoading: true });
    try {
      const items = await notificationService.getNotifications();
      const unread = items.filter((n) => !n.isRead).length;
      set({ notifications: items, unreadCount: unread, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const updated = await notificationService.markAsRead(id);
      const unread = updated.filter((n) => !n.isRead).length;
      set({ notifications: updated, unreadCount: unread });
    } catch {}
  },

  markAllAsRead: async () => {
    try {
      const updated = await notificationService.markAllAsRead();
      set({ notifications: updated, unreadCount: 0 });
    } catch {}
  },

  deleteNotification: async (id: string) => {
    try {
      const updated = await notificationService.deleteNotification(id);
      const unread = updated.filter((n) => !n.isRead).length;
      set({ notifications: updated, unreadCount: unread });
    } catch {}
  },
}));
