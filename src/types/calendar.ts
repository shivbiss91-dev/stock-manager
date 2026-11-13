export type CalendarEventType =
  | 'invoice_due'
  | 'purchase_expected'
  | 'order_deadline'
  | 'scheduled_transfer'
  | 'user_reminder'
  | 'stock_change'
  | 'product_update';

export interface StockChangeDetail {
  itemSku: string;
  sku?: string;
  itemName: string;
  changeType: 'stock_in' | 'stock_out' | 'stock_adjusted' | 'product_created' | 'product_updated' | 'create' | 'update' | 'delete';
  previousStock?: number;
  newStock?: number;
  delta?: number;
  unit?: string;
  reason?: string;
  user?: string;
  referenceNumber?: string;
  referenceType?: string;
  priceOld?: number;
  priceNew?: number;
  stockBefore?: number;
  stockAfter?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // Formatted time e.g. "10:30 AM IST"
  type: CalendarEventType;
  description?: string;
  linkedRecordId?: string;
  linkedRecordType?: 'invoice' | 'purchase' | 'order' | 'transfer' | 'item';
  linkedPath?: string;
  isSystemEvent: boolean;
  createdBy?: string;
  createdAt: string;
  stockChangeDetails?: StockChangeDetail;
}

export type CalendarViewMode = 'month' | 'week' | 'day';

export interface UserReminderInput {
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
}
