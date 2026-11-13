import { CalendarEvent, CalendarEventType, UserReminderInput } from '../types/calendar';
import { StorageService, STORAGE_KEYS } from './storageService';
import { Invoice } from '../types/sales';
import { PurchaseOrder } from '../types/purchase';
import { SalesOrder } from '../types/sales';
import { StockTransfer } from '../types/warehouse';
import { StockMovementRecord } from '../types/itemDetail';
import { AuditLogEntry } from '../types/audit';
import { InventoryItem } from '../types/inventory';

/**
 * Format an ISO timestamp string into IST (Asia/Kolkata) date string and 12-hour time string
 */
export function formatInIST(isoString: string): { dateStr: string; timeStr: string } {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      const parts = isoString.split('T');
      return { dateStr: parts[0] || '', timeStr: '' };
    }

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateStr = formatter.format(d);

    const timeFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const formatted = timeFormatter.format(d).toUpperCase();
    const timeStr = `${formatted} IST`;
    return { dateStr, timeStr };
  } catch {
    return { dateStr: isoString.split('T')[0] || '', timeStr: '' };
  }
}

/**
 * Calendar Service for StockVista
 * 
 * Aggregates actual application business events backed by real records:
 * - Real-time Stock Movements & Adjustments (Stock In, Stock Out, Calibrations)
 * - Product Data Entries & Modifications (New Item Created, Price/Info Updated)
 * - Invoice due dates (from invoices ledger)
 * - Purchase order expected delivery dates
 * - Sales order delivery deadlines
 * - Scheduled stock transfers
 * - User-created operational reminders (persisted locally)
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
   * Fetch all active events across real business records, inventory changes, and reminders
   */
  async getEventsForDate(dateStr: string): Promise<CalendarEvent[]> {
    const all = await this.getEvents();
    return all.filter((ev) => ev.date === dateStr);
  },

  async getEvents(): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];

    // 1. Real Invoices: Due Dates
    const invoices = StorageService.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    invoices.forEach((inv) => {
      if (inv.dueDate && inv.status !== 'cancelled') {
        const rawDate = inv.dueDate.split('T')[0];
        const timeInfo = inv.dueDate.includes('T') ? formatInIST(inv.dueDate).timeStr : '';
        events.push({
          id: `cal-inv-${inv.id}`,
          title: `Invoice ${inv.invoiceNumber} Due (${inv.customerName || 'Client'})`,
          date: rawDate,
          time: timeInfo,
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
        const timeInfo = po.expectedDeliveryDate.includes('T') ? formatInIST(po.expectedDeliveryDate).timeStr : '';
        events.push({
          id: `cal-po-${po.id}`,
          title: `PO ${po.poNumber} Expected (${po.supplierName || 'Vendor'})`,
          date: rawDate,
          time: timeInfo,
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
        const timeInfo = tr.date.includes('T') ? formatInIST(tr.date).timeStr : '';
        events.push({
          id: `cal-tr-${tr.id}`,
          title: `Transfer ${tr.transferNumber}: ${tr.sourceWarehouseName} ➔ ${tr.targetWarehouseName}`,
          date: rawDate,
          time: timeInfo,
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

    // 5. Real Stock Movements & Adjustments (Stock In, Stock Out, Calibrations)
    const movements = StorageService.get<StockMovementRecord[]>(STORAGE_KEYS.MOVEMENTS, []);
    const items = StorageService.get<InventoryItem[]>(STORAGE_KEYS.ITEMS, []);
    const itemsMap = new Map<string, InventoryItem>();
    items.forEach((item) => itemsMap.set(item.id, item));

    movements.forEach((m) => {
      if (!m.date) return;
      const { dateStr, timeStr } = formatInIST(m.date);
      const matchedItem = itemsMap.get(m.itemId);
      const itemName = matchedItem?.name || 'Product';
      const itemSku = matchedItem?.sku || '';

      const delta =
        m.quantityDelta !== undefined
          ? m.quantityDelta
          : m.stockAfter !== undefined && m.stockBefore !== undefined
          ? m.stockAfter - m.stockBefore
          : 0;

      const isPositive = delta > 0;
      const isNegative = delta < 0;

      let title = `Stock Adjusted: ${itemName}`;
      let changeType: 'stock_in' | 'stock_out' | 'stock_adjusted' = 'stock_adjusted';
      if (isPositive) {
        title = `Stock In: +${delta} ${m.unit || 'PCS'} • ${itemName}`;
        changeType = 'stock_in';
      } else if (isNegative) {
        title = `Stock Out: ${delta} ${m.unit || 'PCS'} • ${itemName}`;
        changeType = 'stock_out';
      } else {
        title = `Stock Calibration: ${itemName}`;
      }

      events.push({
        id: `cal-mov-${m.id}`,
        title,
        date: dateStr,
        time: timeStr,
        type: 'stock_change',
        description: `Stock: ${m.stockBefore ?? 0} ➔ ${m.stockAfter ?? 0} ${m.unit || 'PCS'} • ${m.reason || 'Inventory Adjustment'} • By ${m.userName || 'Staff'}`,
        linkedRecordId: m.itemId,
        linkedRecordType: 'item',
        linkedPath: '/items',
        isSystemEvent: true,
        createdBy: m.userName || 'Staff',
        createdAt: m.date,
        stockChangeDetails: {
          itemSku,
          sku: itemSku,
          itemName,
          changeType,
          previousStock: m.stockBefore,
          newStock: m.stockAfter,
          stockBefore: m.stockBefore,
          stockAfter: m.stockAfter,
          delta,
          unit: m.unit || 'PCS',
          reason: m.reason || 'Inventory Adjustment',
          user: m.userName || 'Staff',
          referenceNumber: m.referenceNumber,
        },
      });
    });

    // 6. Real Item Creations, Price Updates & Data Entries from Audit Log
    const auditLogs = StorageService.get<AuditLogEntry[]>(STORAGE_KEYS.AUDIT, []);
    auditLogs.forEach((entry) => {
      if (entry.module === 'inventory' && entry.action !== 'stock_adjusted' && entry.timestamp) {
        const { dateStr, timeStr } = formatInIST(entry.timestamp);
        let title = `Product Data Entry: ${entry.targetDescription}`;
        let changeType: 'product_created' | 'product_updated' = 'product_updated';

        if (entry.action === 'item_created') {
          title = `New Product Added: ${entry.targetDescription}`;
          changeType = 'product_created';
        } else if (entry.action === 'item_updated') {
          title = `Product Updated: ${entry.targetDescription}`;
          changeType = 'product_updated';
        } else if (entry.action === 'item_deleted') {
          title = `Product Removed: ${entry.targetDescription}`;
        }

        events.push({
          id: `cal-audit-${entry.id}`,
          title,
          date: dateStr,
          time: timeStr,
          type: 'product_update',
          description: `${entry.newValue || 'Product record modified'} • By ${entry.userName || 'Admin'}`,
          linkedRecordId: entry.targetId,
          linkedRecordType: 'item',
          linkedPath: '/items',
          isSystemEvent: true,
          createdBy: entry.userName || 'Admin',
          createdAt: entry.timestamp,
          stockChangeDetails: {
            itemSku: entry.targetDescription.includes('(') ? entry.targetDescription.split('(')[1]?.replace(')', '').trim() : '',
            sku: entry.targetDescription.includes('(') ? entry.targetDescription.split('(')[1]?.replace(')', '').trim() : '',
            itemName: entry.targetDescription.split('(')[0]?.trim() || entry.targetDescription,
            changeType,
            reason: entry.oldValue ? `From ${entry.oldValue} to ${entry.newValue}` : (entry.newValue || 'Product updated'),
            user: entry.userName || 'Admin',
          },
        });
      }
    });

    // 7. User-created Reminders from Local Encrypted Storage
    const userReminders = StorageService.get<CalendarEvent[]>(STORAGE_KEYS.CALENDAR_EVENTS, []);
    userReminders.forEach((r) => {
      events.push({
        ...r,
        isSystemEvent: false,
      });
    });

    // Sort chronologically by date and secondary by time/createdAt (latest first on each day)
    return events.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
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
