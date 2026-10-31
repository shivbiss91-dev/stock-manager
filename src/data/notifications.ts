import { NotificationItem } from '../types/notification';

/**
 * Notifications: Empty initial collection for production.
 * Real notifications are generated dynamically by system events (low stock, approvals, audits).
 */
export const MOCK_NOTIFICATIONS: NotificationItem[] = [];
