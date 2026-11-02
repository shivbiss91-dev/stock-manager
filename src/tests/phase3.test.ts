import { describe, it, expect, beforeAll } from 'vitest';
import { materialsService } from '../services/materialsService';
import { inventoryService } from '../services/inventoryService';
import { MATERIAL_CATEGORIES } from '../data/materialCategories';
import { MASTER_INVENTORY } from './fixtures/inventorySeed';

describe('Phase 3: Materials Categories Home', () => {
  beforeAll(() => {
    inventoryService._seedInventoryForTesting(MASTER_INVENTORY);
  });
  it('returns all 4 primary product categories', async () => {
    const categories = await materialsService.getCategories('all');
    expect(categories.length).toBe(4);

    const categoryIds = categories.map((c) => c.id);
    expect(categoryIds).toContain('card_holder');
    expect(categoryIds).toContain('lanyard');
    expect(categoryIds).toContain('hook');
    expect(categoryIds).toContain('button_bag');
  });

  it('allows admin to edit category name', async () => {
    const updated = await materialsService.updateCategoryName(
      'card_holder' as any,
      'Premium Card Holder'
    );
    expect(updated.name).toBe('Premium Card Holder');

    // Reset back
    await materialsService.updateCategoryName('card_holder' as any, 'Card Holder');
    const reset = await materialsService.getCategoryById('card_holder' as any);
    expect(reset?.name).toBe('Card Holder');
  });
});

describe('Phase 3: Material Category Filtering Engine', () => {
  it('filters Wood items by sub-type Plywood', async () => {
    const res = await inventoryService.getItems({
      category: 'wood',
      subtype: 'Plywood',
      pageSize: 5000,
    });

    expect(res.items.length).toBeGreaterThan(0);
    for (const item of res.items) {
      expect(item.materialCategory).toBe('wood');
      expect(item.materialSubtype).toBe('Plywood');
    }
  });

  it('filters Wood items by price range', async () => {
    const minPrice = 1000;
    const maxPrice = 3000;
    const res = await inventoryService.getItems({
      category: 'wood',
      minPrice,
      maxPrice,
      pageSize: 5000,
    });

    for (const item of res.items) {
      expect(item.sellingPrice).toBeGreaterThanOrEqual(minPrice);
      expect(item.sellingPrice).toBeLessThanOrEqual(maxPrice);
    }
  });

  it('filters Wood items by low_stock status', async () => {
    const res = await inventoryService.getItems({
      category: 'wood',
      stockStatus: 'low_stock',
      pageSize: 5000,
    });

    for (const item of res.items) {
      expect(item.stockStatus).toBe('low_stock');
      expect(item.currentStock).toBeGreaterThan(0);
      expect(item.currentStock).toBeLessThanOrEqual(item.reorderLevel);
    }
  });

  it('handles search query across item names and SKUs', async () => {
    const res = await inventoryService.getItems({
      category: 'wood',
      search: 'Marine',
      pageSize: 50,
    });

    expect(res.items.length).toBeGreaterThan(0);
    for (const item of res.items) {
      const match =
        item.name.toLowerCase().includes('marine') ||
        item.sku.toLowerCase().includes('marine');
      expect(match).toBe(true);
    }
  });
});
