import { describe, it, expect } from 'vitest';
import { materialsService } from '../services/materialsService';
import { inventoryService } from '../services/inventoryService';
import { MATERIAL_CATEGORIES } from '../data/materialCategories';

describe('Phase 3: Materials Categories Home', () => {
  it('returns all 8 primary material categories', async () => {
    const categories = await materialsService.getCategories('all');
    expect(categories.length).toBe(8);

    const categoryIds = categories.map((c) => c.id);
    expect(categoryIds).toContain('wood');
    expect(categoryIds).toContain('metal');
    expect(categoryIds).toContain('plastic');
    expect(categoryIds).toContain('glass');
    expect(categoryIds).toContain('fabric');
    expect(categoryIds).toContain('rubber');
    expect(categoryIds).toContain('paper');
    expect(categoryIds).toContain('ceramic');
  });

  it('reports exactly 1,248 items for Wood category', async () => {
    const categories = await materialsService.getCategories('all');
    const wood = categories.find((c) => c.id === 'wood');
    expect(wood).toBeDefined();
    expect(wood?.itemCount).toBe(1248);
  });

  it('allows admin to edit category name', async () => {
    const updated = await materialsService.updateCategoryName(
      'wood',
      'Architectural Wood & Timber'
    );
    expect(updated.name).toBe('Architectural Wood & Timber');

    // Reset back
    await materialsService.updateCategoryName('wood', 'Wood & Timber');
    const reset = await materialsService.getCategoryById('wood');
    expect(reset?.name).toBe('Wood & Timber');
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
