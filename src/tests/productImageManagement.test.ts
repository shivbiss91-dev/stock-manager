import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { inventoryService } from '../services/inventoryService';
import { StorageService, STORAGE_KEYS } from '../services/storageService';
import { authService } from '../services/authService';
import { normalizeProductImageUrl, getCategoryFallbackSvg } from '../components/common/ProductImage';
import { InventoryItem } from '../types/inventory';

describe('Feature: Product Image Editing and Management', () => {
  const SAMPLE_BASE64_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const SAMPLE_BASE64_WEBP = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';

  beforeEach(() => {
    // Reset starter products to ensure known state
    StorageService.resetToFreshInstall();
  });

  afterEach(() => {
    authService.logout();
  });

  describe('1. Image Normalization & Category Fallback Helpers', () => {
    it('normalizes relative, absolute, and base64 URLs safely', () => {
      expect(normalizeProductImageUrl(SAMPLE_BASE64_PNG)).toBe(SAMPLE_BASE64_PNG);
      expect(normalizeProductImageUrl('https://example.com/item.png')).toBe('https://example.com/item.png');
      expect(normalizeProductImageUrl('')).toBe('');
      expect(normalizeProductImageUrl(null)).toBe('');
      
      const rel = normalizeProductImageUrl('/products/card-holder.svg');
      expect(rel).toContain('products/card-holder.svg');
    });

    it('returns dedicated fallback SVGs for each of the 4 approved categories', () => {
      expect(getCategoryFallbackSvg('card_holder')).toContain('card-holder.svg');
      expect(getCategoryFallbackSvg('lanyard')).toContain('lanyard.svg');
      expect(getCategoryFallbackSvg('hook')).toContain('hook.svg');
      expect(getCategoryFallbackSvg('button_bag')).toContain('button-bag.svg');
      expect(getCategoryFallbackSvg('unknown_cat')).toBe('');
    });
  });

  describe('2. Image Upload, Replace & Removal for all 4 products', () => {
    it('uploads a new image for Card Holder and preserves SKU, HSN, price, and stock', async () => {
      const items = await inventoryService.getAllItems();
      const cardHolder = items.find((i) => i.name === 'Card Holder');
      expect(cardHolder).toBeDefined();

      const originalSku = cardHolder!.sku;
      const originalStock = cardHolder!.currentStock;
      const originalCost = cardHolder!.costPrice;
      const originalSelling = cardHolder!.sellingPrice;
      const originalHsn = cardHolder!.hsnCode;

      // Update image
      const updated = await inventoryService.updateItem(cardHolder!.id, {
        images: [SAMPLE_BASE64_PNG],
      });

      expect(updated.images[0]).toBe(SAMPLE_BASE64_PNG);
      // Ensure other fields were NOT modified
      expect(updated.sku).toBe(originalSku);
      expect(updated.currentStock).toBe(originalStock);
      expect(updated.costPrice).toBe(originalCost);
      expect(updated.sellingPrice).toBe(originalSelling);
      expect(updated.hsnCode).toBe(originalHsn);

      // Verify re-fetch returns the updated image
      const reloaded = await inventoryService.getItemById(cardHolder!.id);
      expect(reloaded?.images[0]).toBe(SAMPLE_BASE64_PNG);
    });

    it('replaces an existing image for Lanyard with WEBP image', async () => {
      const items = await inventoryService.getAllItems();
      const lanyard = items.find((i) => i.name === 'Lanyard');
      expect(lanyard).toBeDefined();

      // Step 1: Upload first image
      await inventoryService.updateItem(lanyard!.id, {
        images: [SAMPLE_BASE64_PNG],
      });

      // Step 2: Replace with second image
      const replaced = await inventoryService.updateItem(lanyard!.id, {
        images: [SAMPLE_BASE64_WEBP],
      });

      expect(replaced.images[0]).toBe(SAMPLE_BASE64_WEBP);

      const reloaded = await inventoryService.getItemById(lanyard!.id);
      expect(reloaded?.images[0]).toBe(SAMPLE_BASE64_WEBP);
    });

    it('removes an image from Hook and leaves empty array for placeholder display', async () => {
      const items = await inventoryService.getAllItems();
      const hook = items.find((i) => i.name === 'Hook');
      expect(hook).toBeDefined();

      // Remove image by setting empty array
      const updated = await inventoryService.updateItem(hook!.id, {
        images: [],
      });

      expect(updated.images).toEqual([]);

      const reloaded = await inventoryService.getItemById(hook!.id);
      expect(reloaded?.images).toEqual([]);
      // When reloaded.images is empty, ProductImage component safely displays category placeholder
      const fallback = getCategoryFallbackSvg(reloaded?.materialCategory);
      expect(fallback).toContain('hook.svg');
    });

    it('uploads and updates Button Bag image with persistence across storage reload', async () => {
      const items = await inventoryService.getAllItems();
      const buttonBag = items.find((i) => i.name === 'Button Bag');
      expect(buttonBag).toBeDefined();

      await inventoryService.updateItem(buttonBag!.id, {
        images: [SAMPLE_BASE64_PNG],
      });

      // Simulate browser refresh by reading directly from StorageService
      const storedItems = StorageService.get<InventoryItem[]>(STORAGE_KEYS.ITEMS, []);
      const storedBag = storedItems.find((i) => i.id === buttonBag!.id);
      expect(storedBag?.images[0]).toBe(SAMPLE_BASE64_PNG);
    });
  });

  describe('3. Multi-product isolation and SKU integrity', () => {
    it('ensures updating one product image does not overwrite or corrupt others', async () => {
      const items = await inventoryService.getAllItems();
      expect(items.length).toBe(4);

      const ch = items.find((i) => i.name === 'Card Holder')!;
      const lan = items.find((i) => i.name === 'Lanyard')!;

      // Update Card Holder only
      await inventoryService.updateItem(ch.id, {
        images: [SAMPLE_BASE64_PNG],
      });

      // Check Lanyard is unaffected
      const fetchedLan = await inventoryService.getItemById(lan.id);
      expect(fetchedLan?.images[0]).not.toBe(SAMPLE_BASE64_PNG);
      expect(fetchedLan?.sku).toBe(lan.sku);
    });
  });
});
