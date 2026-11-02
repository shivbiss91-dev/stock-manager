import { CalendarEvent, CalendarEventType, UserReminderInput } from '../types/calendar';
import { StorageService, STORAGE_KEYS } from './storageService';
import { Invoice } from '../types/sales';
import { PurchaseOrder } from '../types/purchase';
import { SalesOrder } from '../types/sales';
import { StockTransfer } from '../types/warehouse';

/**
 * Calendar Service for StockVista
 * 
 * Aggregates ONLY actual application business events backed by real records:
 * - Invoice due dates (from invoices ledger)
 * - Purchase order expected delivery dates
 * - Sales order delivery deadlines
 * - Scheduled stock transfers
 * - User-created operational reminders (persisted locally)
 * 
 * Strict rule: No fabricated appointments, mock holidays, or fake deadlines.
 */
export const calendarService = {
  /**
   * Get current date formatted in Asia/Kolkata timezone
   */
  getCurrentDateInTimezone(timeZone = 'Asia/Kolkata'): {
    dateString: string; // YYYY-MM-DD
    year: number;
    month: number; // 0-indexed
    day: number;
    formatted: string;
  } {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.format(now).split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-based
    const day = parseInt(parts[2], 10);
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const displayFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return {
      dateString,
      year,
      month,
      day,
      formatted: displayFormatter.format(now),
    };
  },

  /**
   * Fetch all active events across real business records and user reminders
   */
  async getEvents(): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];

    // 1. Real Invoices: Due Dates
    const invoices = StorageService.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    invoices.forEach((inv) => {
      if (inv.dueDate && inv.status !== 'cancelled') {
        const rawDate = inv.dueDate.split('T')[0];
        events.push({
          id: `cal-inv-${inv.id}`,
          title: `Invoice ${inv.invoiceNumber} Due (${inv.customerName || 'Client'})`,
          date: rawDate,
          type: 'invoice_due',
          description: `Outstanding balance: ₹${(inv.balanceDue || inv.grandTotal || 0).toLocaleString('en-IN')}`,
          linkedRecordId: inv.id,
          linkedRecordType: 'invoice',
          linkedPath: '/sales/invoices',
          isSystemEvent: true,
          createdAt: inv.createdAt || new Date().toISOString(),
        });
      }
    });

    // 2. Real Purchase Orders: Expected Deliveries
    const purchaseOrders = StorageService.get<PurchaseOrder[]>(STORAGE_KEYS.PURCHASES, []);
    purchaseOrders.forEach((po) => {
      if (po.expectedDeliveryDate && po.status !== 'cancelled') {
        const rawDate = po.expectedDeliveryDate.split('T')[0];
        events.push({
          id: `cal-po-${po.id}`,
          title: `PO ${po.poNumber} Expected (${po.supplierName || 'Vendor'})`,
          date: rawDate,
          type: 'purchase_expected',
          description: `Total PO value: ₹${(po.totalAmountINR || 0).toLocaleString('en-IN')}`,
          linkedRecordId: po.id,
          linkedRecordType: 'purchase',
          linkedPath: '/purchases/orders',
          isSystemEvent: true,
          createdAt: po.createdAt || new Date().toISOString(),
        });
      }
    });

    // 3. Real Sales Orders: Deadlines
    const salesOrders = StorageService.get<SalesOrder[]>(STORAGE_KEYS.SALES_ORDERS, []);
    salesOrders.forEach((so) => {
      const orderDate = (so.deliveryDate || so.orderDate || '').split('T')[0];
      if (orderDate && so.status !== 'cancelled') {
        events.push({
          id: `cal-so-${so.id}`,
          title: `Order ${so.orderNumber} Dispatch Deadline`,
          date: orderDate,
          type: 'order_deadline',
          description: `Customer: ${so.customerName || 'Wholesale Client'}`,
          linkedRecordId: so.id,
          linkedRecordType: 'order',
          linkedPath: '/sales/orders',
          isSystemEvent: true,
          createdAt: so.createdAt || new Date().toISOString(),
        });
      }
    });

    // 4. Real Stock Transfers: Scheduled Dates
    const transfers = StorageService.get<StockTransfer[]>(STORAGE_KEYS.TRANSFERS, []);
    transfers.forEach((tr) => {
      if (tr.date) {
        const rawDate = tr.date.split('T')[0];
        events.push({
          id: `cal-tr-${tr.id}`,
          title: `Transfer ${tr.transferNumber}: ${tr.sourceWarehouseName} ➔ ${tr.targetWarehouseName}`,
          date: rawDate,
          type: 'scheduled_transfer',
          description: `Status: ${tr.status.replace(/_/g, ' ').toUpperCase()}`,
          linkedRecordId: tr.id,
          linkedRecordType: 'transfer',
          linkedPath: '/transfers',
          isSystemEvent: true,
          createdAt: tr.createdAt || new Date().toISOString(),
        });
      }
    });

    // 5. User-created Reminders from Local Encrypted Storage
    const userReminders = StorageService.get<CalendarEvent[]>(STORAGE_KEYS.CALENDAR_EVENTS, []);
    userReminders.forEach((r) => {
      events.push({
        ...r,
        isSystemEvent: false,
      });
    });

    // Sort chronologically by date
    return events.sort((a, b) => a.date.localeCompare(b.date));
  },

  /**
   * Add a user-created operational reminder
   */
  async addReminder(input: UserReminderInput, createdBy = 'User'): Promise<CalendarEvent> {
    const reminders = StorageService.get<CalendarEvent[]>(STORAGE_KEYS.CALENDAR_EVENTS, []);
    const newReminder: CalendarEvent = {
      id: `reminder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: input.title.trim(),
      date: input.date.trim(),
      type: 'user_reminder',
      description: input.description?.trim() || '',
      isSystemEvent: false,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    reminders.push(newReminder);
    StorageService.set(STORAGE_KEYS.CALENDAR_EVENTS, reminders);
    return newReminder;
  },

  /**
   * Update an existing user reminder
   */
  async updateReminder(id: string, updates: Partial<UserReminderInput>): Promise<CalendarEvent> {
    const reminders = StorageService.get<CalendarEvent[]>(STORAGE_KEYS.CALENDAR_EVENTS, []);
    const index = reminders.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error('Reminder not found or cannot be modified.');
    }

    const current = reminders[index];
    const updated: CalendarEvent = {
      ...current,
      title: updates.title !== undefined ? updates.title.trim() : current.title,
      date: updates.date !== undefined ? updates.date.trim() : current.date,
      description: updates.description !== undefined ? updates.description.trim() : current.description,
    };

    reminders[index] = updated;
    StorageService.set(STORAGE_KEYS.CALENDAR_EVENTS, reminders);
    return updated;
  },

  /**
   * Delete a user reminder
   */
  async deleteReminder(id: string): Promise<void> {
    const reminders = StorageService.get<CalendarEvent[]>(STORAGE_KEYS.CALENDAR_EVENTS, []);
    const filtered = reminders.filter((r) => r.id !== id);
    StorageService.set(STORAGE_KEYS.CALENDAR_EVENTS, filtered);
  },
};
