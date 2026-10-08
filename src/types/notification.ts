export type NotificationType = 'low_stock' | 'payment_overdue' | 'approval_required' | 'backup_status' | 'order_update' | 'security';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  isRead: boolean;
  link?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}
