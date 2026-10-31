import { NotificationItem } from '../types/notification';
import { StorageService, STORAGE_KEYS } from './storageService';

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    return StorageService.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },

  async markAsRead(id: string): Promise<NotificationItem[]> {
    const list = StorageService.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    StorageService.set(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  },

  async markAllAsRead(): Promise<NotificationItem[]> {
    const list = StorageService.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = list.map((n) => ({ ...n, isRead: true }));
    StorageService.set(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  },

  async deleteNotification(id: string): Promise<NotificationItem[]> {
    const list = StorageService.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = list.filter((n) => n.id !== id);
    StorageService.set(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  },

  async addNotification(
    item: Omit<NotificationItem, 'id' | 'isRead'> & { timestamp?: string }
  ): Promise<NotificationItem> {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      isRead: false,
      timestamp: item.timestamp || new Date().toISOString(),
      priority: item.priority || 'medium',
    };
    const list = StorageService.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const updated = [newNotif, ...list];
    StorageService.set(STORAGE_KEYS.NOTIFICATIONS, updated);
    return newNotif;
  },
};

