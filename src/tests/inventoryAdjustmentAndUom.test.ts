import { describe, it, expect, beforeEach } from 'vitest';
import {
  PREDEFINED_UNITS,
  PREDEFINED_UNIT_CODES,
  isPredefinedUnit,
  convertToBaseQuantity,
  convertFromBaseQuantity,
  formatPackagingBreakdown,
  PackagingConversions,
} from '../utils/unitConversions';
import { inventoryService } from '../services/inventoryService';
import { stockMovementService } from '../services/stockMovementService';
import { notificationService } from '../services/notificationService';
import { MASTER_INVENTORY } from './fixtures/inventorySeed';

describe('Inventory Master Catalog — Unit of Measurement Restrictions', () => {
  beforeEach(() => {
    inventoryService._seedInventoryForTesting(MASTER_INVENTORY);
  });
  it('contains ONLY the 6 strictly allowed predefined units', () => {
    expect(PREDEFINED_UNIT_CODES).toHaveLength(6);
    expect(PREDEFINED_UNIT_CODES).toEqual(['PCS', 'UNT', 'DOZ', 'CTN', 'BOX', 'BDL']);
  });

  it('strictly excludes removed units: KG, GM, LTR, MTR, SQFT, SQM', () => {
    const forbidden = ['KG', 'GM', 'LTR', 'MTR', 'SQFT', 'SQM', 'kg', 'meters', 'litres'];
    for (const unit of forbidden) {
      expect(isPredefinedUnit(unit)).toBe(false);
      expect(PREDEFINED_UNIT_CODES.includes(unit as any)).toBe(false);
    }
  });

  it('has descriptive metadata for every predefined unit', () => {
    for (const u of PREDEFINED_UNITS) {
      expect(u.code).toBeDefined();
      expect(u.label).toBeDefined();
      expect(typeof u.isPackUnit).toBe('boolean');
      expect(u.description).toBeDefined();
    }
  });
});

describe('Product-Specific Packaging Conversions', () => {
  const customConversions: PackagingConversions = {
    baseUnit: 'PCS',
    dozenMultiplier: 12,
    boxMultiplier: 24,    // 1 Box = 24 Pieces
    cartonMultiplier: 144, // 1 Carton = 144 Pieces
    bundleMultiplier: 50,  // 1 Bundle = 50 Pieces
  };

  it('converts Dozens to Pieces using fixed multiplier 12', () => {
    expect(convertToBaseQuantity(5, 'DOZ', customConversions)).toBe(60);
    expect(convertFromBaseQuantity(60, 'DOZ', customConversions)).toBe(5);
  });

  it('converts Box, Carton, and Bundle units using product-specific multipliers', () => {
    // 3 Boxes = 3 * 24 = 72 Pieces
    expect(convertToBaseQuantity(3, 'BOX', customConversions)).toBe(72);
    expect(convertFromBaseQuantity(72, 'BOX', customConversions)).toBe(3);

    // 2 Cartons = 2 * 144 = 288 Pieces
    expect(convertToBaseQuantity(2, 'CTN', customConversions)).toBe(288);
    expect(convertFromBaseQuantity(288, 'CTN', customConversions)).toBe(2);

    // 4 Bundles = 4 * 50 = 200 Pieces
    expect(convertToBaseQuantity(4, 'BDL', customConversions)).toBe(200);
    expect(convertFromBaseQuantity(200, 'BDL', customConversions)).toBe(4);
  });

  it('formats packaging breakdown accurately into compound packs', () => {
    // 300 Pieces with CTN=144, BOX=24 -> 2 CTN (288) + 0 BOX + 12 PCS
    const breakdown = formatPackagingBreakdown(300, customConversions);
    expect(breakdown).toBe('2 CTN + 12 PCS');

    // 168 Pieces -> 1 CTN (144) + 1 BOX (24) + 0 PCS
    const breakdown2 = formatPackagingBreakdown(168, customConversions);
    expect(breakdown2).toBe('1 CTN + 1 BOX');
  });
});

describe('Manual Stock Adjustments & Direct Quantity Editing', () => {
  it('performs manual plus (+) stock addition and updates balance', async () => {
    const item = await inventoryService.getItemById('item-wd-0001');
    expect(item).not.toBeNull();
    const initialStock = item!.currentStock;

    const updated = await inventoryService.updateStock(item!.id, {
      mode: 'add',
      adjustmentQuantity: 25,
      unit: 'PCS',
      reason: 'Physical Audit Count (+)',
      notes: 'Verified rack shelf B1',
      userName: 'Senior Auditor',
      userRole: 'Admin',
    });

    expect(updated.currentStock).toBe(initialStock + 25);
  });

  it('performs manual minus (-) stock deduction and updates balance', async () => {
    const item = await inventoryService.getItemById('item-wd-0001');
    expect(item).not.toBeNull();
    const initialStock = item!.currentStock;

    const updated = await inventoryService.updateStock(item!.id, {
      mode: 'deduct',
      adjustmentQuantity: 10,
      unit: 'PCS',
      reason: 'Damaged / Broken in Warehouse',
      notes: 'Water leakage damage write-off',
      userName: 'Warehouse Master',
      userRole: 'Manager',
    });

    expect(updated.currentStock).toBe(initialStock - 10);
  });

  it('performs direct quantity editing to an exact target count', async () => {
    const item = await inventoryService.getItemById('item-wd-0001');
    expect(item).not.toBeNull();

    const targetCount = 250;
    const updated = await inventoryService.updateStock(item!.id, {
      mode: 'direct',
      targetStock: targetCount,
      unit: 'PCS',
      reason: 'Annual Physical Inventory Audit',
      notes: 'Full cycle count reconciliation',
      userName: 'Operations Lead',
      userRole: 'Admin',
    });

    expect(updated.currentStock).toBe(targetCount);
  });

  it('strictly prevents negative stock and throws an error', async () => {
    const item = await inventoryService.getItemById('item-wd-0001');
    expect(item).not.toBeNull();

    await expect(
      inventoryService.updateStock(item!.id, {
        mode: 'deduct',
        adjustmentQuantity: item!.currentStock + 500,
        unit: 'PCS',
        reason: 'Illegal excessive deduction',
      })
    ).rejects.toThrow(/Insufficient stock/i);
  });
});

describe('Stock Movement Ledger Audit Trail', () => {
  it('records previous quantity, delta, new quantity, reason, user, and timestamp', async () => {
    const item = await inventoryService.getItemById('item-wd-0001');
    expect(item).not.toBeNull();
    const prevStock = item!.currentStock;

    await inventoryService.updateStock(item!.id, {
      mode: 'add',
      adjustmentQuantity: 15,
      unit: 'PCS',
      reason: 'Supplier Replacement Lot',
      notes: 'Lot #SR-9912',
      userName: 'Suresh Patil',
      userRole: 'Warehouse Master',
      referenceNumber: 'ADJ-TEST-001',
    });

    const movements = await stockMovementService.getMovements({ itemId: item!.id });
    expect(movements.length).toBeGreaterThan(0);

    const latest = movements[0];
    expect(latest.stockBefore).toBe(prevStock);
    expect(latest.quantityDelta).toBe(15);
    expect(latest.stockAfter).toBe(prevStock + 15);
    expect(latest.userName).toBe('Suresh Patil');
    expect(latest.userRole).toBe('Warehouse Master');
    expect(latest.reason).toBe('Supplier Replacement Lot');
    expect(latest.date).toBeDefined();
    expect(new Date(latest.date).getTime()).toBeGreaterThan(0);
  });
});

describe('Threshold Alerts Triggering', () => {
  it('triggers low-stock alert when stock is adjusted to or below reorderLevel', async () => {
    const item = await inventoryService.getItemById('item-wd-0001');
    expect(item).not.toBeNull();

    // Adjust stock directly to equal reorder level
    await inventoryService.updateStock(item!.id, {
      mode: 'direct',
      targetStock: item!.reorderLevel,
      unit: 'PCS',
      reason: 'Simulated threshold test',
      userName: 'QA Automation',
    });

    const notifications = await notificationService.getNotifications();
    const lowStockNotif = notifications.find(
      (n) => n.type === 'low_stock' && n.message.includes(item!.sku)
    );
    expect(lowStockNotif).toBeDefined();
  });

  it('triggers out-of-stock alert when stock is reduced to 0', async () => {
    const item = await inventoryService.getItemById('item-wd-0001');
    expect(item).not.toBeNull();

    // Adjust stock directly to 0
    await inventoryService.updateStock(item!.id, {
      mode: 'direct',
      targetStock: 0,
      unit: 'PCS',
      reason: 'Simulated stockout test',
      userName: 'QA Automation',
    });

    const notifications = await notificationService.getNotifications();
    const outOfStockNotif = notifications.find(
      (n) => n.type === 'out_of_stock' && n.message.includes(item!.sku)
    );
    expect(outOfStockNotif).toBeDefined();
  });
});
