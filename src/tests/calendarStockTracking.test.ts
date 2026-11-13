import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storageService';
import { inventoryService } from '../services/inventoryService';
import { calendarService } from '../services/calendarService';

describe('Calendar Stock & Product Change Tracking with Exact Date & Time', () => {
  beforeEach(() => {
    StorageService.resetToFreshInstall();
  });

  it('automatically adds a stock_change calendar event when stock is updated via inventoryService', async () => {
    const items = await inventoryService.getAllItems();
    const cardHolder = items.find((i) => i.name === 'Card Holder')!;
    expect(cardHolder).toBeDefined();

    await inventoryService.updateStock(
      cardHolder.id,
      {
        targetStock: 150,
        mode: 'direct',
        reason: 'Physical inventory audit stock addition',
        referenceNumber: 'AUD-2026-001',
        userName: 'Sweedal Admin',
      }
    );

    const events = await calendarService.getEvents();
    const stockEvent = events.find((e) => e.type === 'stock_change' && e.linkedRecordId === cardHolder.id);

    expect(stockEvent).toBeDefined();
    expect(stockEvent?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(stockEvent?.time).toBeDefined();
    expect(stockEvent?.time).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)\s?IST/);
    expect(stockEvent?.stockChangeDetails).toBeDefined();
    expect(stockEvent?.stockChangeDetails?.sku).toBe(cardHolder.sku);
    expect(stockEvent?.stockChangeDetails?.itemName).toBe('Card Holder');
    expect(stockEvent?.stockChangeDetails?.delta).toBe(150);
    expect(stockEvent?.stockChangeDetails?.stockBefore).toBe(0);
    expect(stockEvent?.stockChangeDetails?.stockAfter).toBe(150);
    expect(stockEvent?.stockChangeDetails?.reason).toBe('Physical inventory audit stock addition');
    expect(stockEvent?.stockChangeDetails?.user).toBe('Sweedal Admin');
    expect(stockEvent?.linkedPath).toBe('/items');
  });

  it('automatically adds a product_update calendar event when product details are updated', async () => {
    const items = await inventoryService.getAllItems();
    const lanyard = items.find((i) => i.name === 'Lanyard')!;
    expect(lanyard).toBeDefined();

    await inventoryService.updateItem(
      lanyard.id,
      {
        sellingPrice: 75,
      },
      'admin-1',
      'Sweedal Admin'
    );

    const events = await calendarService.getEvents();
    const productEvent = events.find((e) => e.type === 'product_update' && e.linkedRecordId === lanyard.id);

    expect(productEvent).toBeDefined();
    expect(productEvent?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(productEvent?.time).toBeDefined();
    expect(productEvent?.time).toContain('IST');
    expect(productEvent?.stockChangeDetails?.sku).toBe(lanyard.sku);
    expect(productEvent?.stockChangeDetails?.changeType).toBe('product_updated');
  });

  it('filters events by exact date so clicking a date shows only that day changes', async () => {
    const items = await inventoryService.getAllItems();
    const hook = items.find((i) => i.name === 'Hook')!;
    expect(hook).toBeDefined();

    await inventoryService.updateStock(
      hook.id,
      {
        targetStock: 80,
        mode: 'direct',
        reason: 'Stock addition for testing',
        referenceNumber: 'TST-001',
        userName: 'Sweedal Admin',
      }
    );

    const events = await calendarService.getEvents();
    const hookEvent = events.find((e) => e.linkedRecordId === hook.id)!;
    expect(hookEvent).toBeDefined();

    const dayEvents = await calendarService.getEventsForDate(hookEvent.date);
    expect(dayEvents.length).toBeGreaterThanOrEqual(1);
    expect(dayEvents.some((ev) => ev.linkedRecordId === hook.id)).toBe(true);
    dayEvents.forEach((ev) => {
      expect(ev.date).toBe(hookEvent.date);
      expect(ev.time).toBeDefined();
    });
  });
});
