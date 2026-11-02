export type CalendarEventType =
  | 'invoice_due'
  | 'purchase_expected'
  | 'order_deadline'
  | 'scheduled_transfer'
  | 'user_reminder';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: CalendarEventType;
  description?: string;
  linkedRecordId?: string;
  linkedRecordType?: 'invoice' | 'purchase' | 'order' | 'transfer';
  linkedPath?: string;
  isSystemEvent: boolean;
  createdBy?: string;
  createdAt: string;
}

export type CalendarViewMode = 'month' | 'week' | 'day';

export interface UserReminderInput {
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
}
