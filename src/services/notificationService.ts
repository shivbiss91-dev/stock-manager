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
};
