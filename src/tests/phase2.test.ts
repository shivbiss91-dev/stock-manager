import { describe, it, expect, beforeAll } from 'vitest';
import { MASTER_INVENTORY } from './fixtures/inventorySeed';
import { inventoryService, computeItemStatus } from '../services/inventoryService';
import { dashboardService } from '../services/dashboardService';

describe('Phase 2: Master Inventory Dataset Constraints', () => {
  beforeAll(() => {
    inventoryService._seedInventoryForTesting(MASTER_INVENTORY);
  });
  it('contains over 3,000 items in total', () => {
    expect(MASTER_INVENTORY.length).toBeGreaterThanOrEqual(3000);
    expect(MASTER_INVENTORY.length).toBe(3420);
  });

  it('contains exactly 1,248 Wood items as strictly specified', () => {
    const woodItems = MASTER_INVENTORY.filter((item) => item.materialCategory === 'wood');
    expect(woodItems.length).toBe(1248);
  });

  it('ensures all items have non-negative stock and valid HSN codes', () => {
    for (const item of MASTER_INVENTORY) {
      expect(item.currentStock).toBeGreaterThanOrEqual(0);
      expect(item.reorderLevel).toBeGreaterThan(0);
      expect(item.costPrice).toBeGreaterThan(0);
      expect(item.sellingPrice).toBeGreaterThan(0);
      expect(item.hsnCode).toBeDefined();
      expect(item.hsnCode.length).toBeGreaterThanOrEqual(6);
    }
  });

  it('verifies unique SKUs across the catalog', () => {
    const skuSet = new Set<string>();
    for (const item of MASTER_INVENTORY) {
      expect(skuSet.has(item.sku)).toBe(false);
      skuSet.add(item.sku);
    }
  });
});

describe('Phase 2: Stock Status & Calculation Rules', () => {
  it('correctly derives stock status strictly from item reorder level', () => {
    // Out of Stock = 0
    const outOfStockItem = { ...MASTER_INVENTORY[0], currentStock: 0, reorderLevel: 25 };
    expect(computeItemStatus(outOfStockItem)).toBe('out_of_stock');

    // Low Stock = 1 up to reorder level
    const lowStockItem = { ...MASTER_INVENTORY[0], currentStock: 15, reorderLevel: 25 };
    expect(computeItemStatus(lowStockItem)).toBe('low_stock');

    // In Stock = above reorder level with recent sales
    const inStockItem = {
      ...MASTER_INVENTORY[0],
      currentStock: 100,
      reorderLevel: 25,
      sales30Days: 45,
    };
    expect(computeItemStatus(inStockItem)).toBe('in_stock');
  });

  it('ensures filter status counts always add up to total items', async () => {
    const res = await inventoryService.getItems({ pageSize: 5000 });
    const { inStock, lowStock, outOfStock, deadStock, total } = res.statusCounts;

    expect(inStock + lowStock + outOfStock + deadStock).toBe(total);
    expect(total).toBe(MASTER_INVENTORY.length);
  });

  it('prevents stock from dropping below zero during adjustments', async () => {
    const item = MASTER_INVENTORY[0];
    await expect(
      inventoryService.updateStock(item.id, -(item.currentStock + 500), 'Illegal deduction', 'Tester')
    ).rejects.toThrow(/Insufficient stock/);
  });
});

describe('Phase 2: Dashboard KPIs and Layout', () => {
  it('computes consistent stock donut percentages that sum to 100%', async () => {
    const donut = await dashboardService.getStockDonut('all');
    const totalPercentage = donut.reduce((sum, d) => sum + d.percentage, 0);
    expect(Math.round(totalPercentage)).toBe(100);
  });

  it('retrieves and saves dashboard layout per user ID', () => {
    const layout = dashboardService.getUserLayout('test-user');
    expect(layout.cardOrder).toBeDefined();
    expect(layout.cardOrder.length).toBe(5);

    const updatedLayout = {
      cardOrder: ['logistics_map_card', 'orders_card'],
      hiddenCards: ['stock_donut_card'],
    };
    dashboardService.saveUserLayout('test-user', updatedLayout);
    const retrieved = dashboardService.getUserLayout('test-user');
    expect(retrieved.cardOrder[0]).toBe('logistics_map_card');
    expect(retrieved.hiddenCards).toContain('stock_donut_card');
  });
});
