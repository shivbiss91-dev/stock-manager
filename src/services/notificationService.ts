import { MOCK_NOTIFICATIONS } from '../data/notifications';
import { NotificationItem } from '../types/notification';

let notificationsState = [...MOCK_NOTIFICATIONS];

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    await new Promise((res) => setTimeout(res, 80));
    return [...notificationsState];
  },

  async markAsRead(id: string): Promise<NotificationItem[]> {
    await new Promise((res) => setTimeout(res, 50));
    notificationsState = notificationsState.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    return [...notificationsState];
  },

  async markAllAsRead(): Promise<NotificationItem[]> {
    await new Promise((res) => setTimeout(res, 50));
    notificationsState = notificationsState.map((n) => ({ ...n, isRead: true }));
    return [...notificationsState];
  },

  async deleteNotification(id: string): Promise<NotificationItem[]> {
    await new Promise((res) => setTimeout(res, 50));
    notificationsState = notificationsState.filter((n) => n.id !== id);
    return [...notificationsState];
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
    notificationsState.unshift(newNotif);
    return newNotif;
  },
};
