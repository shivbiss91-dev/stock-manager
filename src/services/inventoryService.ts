import { MASTER_INVENTORY } from '../data/inventorySeed';
import {
  InventoryItem,
  ComputedInventoryItem,
  MaterialCategory,
  SalesVelocity,
} from '../types/inventory';
import { StockStatus } from '../types/common';
import { stockMovementService } from './stockMovementService';
import { notificationService } from './notificationService';
import {
  convertToBaseQuantity,
  DEFAULT_PACKAGING_CONVERSIONS,
} from '../utils/unitConversions';

export interface StockAdjustmentInput {
  mode?: 'add' | 'deduct' | 'direct';
  adjustmentQuantity?: number;
  delta?: number;
  targetStock?: number;
  unit?: string;
  reason: string;
  notes?: string;
  userName?: string;
  userRole?: string;
  referenceNumber?: string;
}

// Local mutable repository for items
let itemsDatabase: InventoryItem[] = [...MASTER_INVENTORY];

export interface InventoryFilterOptions {
  warehouseId?: string;
  category?: MaterialCategory | 'all';
  subtype?: string;
  search?: string;
  stockStatus?: StockStatus | 'all';
  supplierId?: string;
  minPrice?: number;
  maxPrice?: number;
  salesVelocity?: SalesVelocity | 'all';
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'sku' | 'currentStock' | 'sellingPrice' | 'sales30Days';
  sortOrder?: 'asc' | 'desc';
}

export interface InventoryListResult {
  items: ComputedInventoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: {
    inStock: number;
    lowStock: number;
    outOfStock: number;
    deadStock: number;
    total: number;
  };
}

/**
 * Derives stock status based strictly on the item's reorder level:
 * - Out of Stock = 0
 * - Low Stock = 1 up to reorder level
 * - Dead Stock = no sales in 90+ days & has stock
 * - In Stock = above reorder level
 */
export function computeItemStatus(item: InventoryItem): StockStatus {
  if (item.currentStock <= 0) {
    return 'out_of_stock';
  }
  if (item.currentStock <= item.reorderLevel) {
    return 'low_stock';
  }
  if (item.sales30Days === 0) {
    return 'dead_stock';
  }
  return 'in_stock';
}

/**
 * Derives sales velocity:
 * High: >= 60 units/month
 * Medium: 20-59 units/month
 * Low: < 20 units/month
 */
export function computeSalesVelocity(item: InventoryItem): SalesVelocity {
  if (item.sales30Days >= 60) return 'High';
  if (item.sales30Days >= 20) return 'Medium';
  return 'Low';
}

export function toComputedItem(item: InventoryItem): ComputedInventoryItem {
  return {
    ...item,
    stockStatus: computeItemStatus(item),
    salesVelocity: computeSalesVelocity(item),
    stockValueINR: item.currentStock * item.costPrice,
  };
}

export const inventoryService = {
  async getItems(options: InventoryFilterOptions = {}): Promise<InventoryListResult> {
    await new Promise((res) => setTimeout(res, 60)); // Fast async response

    const {
      warehouseId,
      category,
      subtype,
      search,
      stockStatus,
      supplierId,
      minPrice,
      maxPrice,
      salesVelocity,
      page = 1,
      pageSize = 25,
      sortBy = 'name',
      sortOrder = 'asc',
    } = options;

    let computed = itemsDatabase.map(toComputedItem);

    // Filter by warehouse
    if (warehouseId && warehouseId !== 'all') {
      computed = computed.filter((item) => item.warehouseId === warehouseId);
    }

    // Filter by material category
    if (category && category !== 'all') {
      computed = computed.filter((item) => item.materialCategory === category);
    }

    // Filter by material sub-type
    if (subtype && subtype !== 'all') {
      computed = computed.filter((item) => item.materialSubtype === subtype);
    }

    // Global counts before status filter for accurate breakdown tabs
    const statusCounts = {
      inStock: computed.filter((i) => i.stockStatus === 'in_stock').length,
      lowStock: computed.filter((i) => i.stockStatus === 'low_stock').length,
      outOfStock: computed.filter((i) => i.stockStatus === 'out_of_stock').length,
      deadStock: computed.filter((i) => i.stockStatus === 'dead_stock').length,
      total: computed.length,
    };

    // Filter by stock status
    if (stockStatus && stockStatus !== 'all') {
      computed = computed.filter((item) => item.stockStatus === stockStatus);
    }

    // Filter by supplier
    if (supplierId && supplierId !== 'all') {
      computed = computed.filter((item) => item.supplierId === supplierId);
    }

    // Filter by price range
    if (minPrice !== undefined) {
      computed = computed.filter((item) => item.sellingPrice >= minPrice);
    }
    if (maxPrice !== undefined) {
      computed = computed.filter((item) => item.sellingPrice <= maxPrice);
    }

    // Filter by velocity
    if (salesVelocity && salesVelocity !== 'all') {
      computed = computed.filter((item) => item.salesVelocity === salesVelocity);
    }

    // Search query filter (search by name, SKU, HSN, description)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      computed = computed.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.hsnCode.includes(q) ||
          item.rackLocation.toLowerCase().includes(q)
      );
    }

    // Sorting
    computed.sort((a, b) => {
      let valA: string | number = a[sortBy] ?? '';
      let valB: string | number = b[sortBy] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const totalCount = computed.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIdx = (page - 1) * pageSize;
    const paginatedItems = computed.slice(startIdx, startIdx + pageSize);

    return {
      items: paginatedItems,
      totalCount,
      page,
      pageSize,
      totalPages,
      statusCounts,
    };
  },

  async getItemById(id: string): Promise<ComputedInventoryItem | null> {
    await new Promise((res) => setTimeout(res, 40));
    const item = itemsDatabase.find((i) => i.id === id);
    return item ? toComputedItem(item) : null;
  },

  async getItemBySku(sku: string): Promise<ComputedInventoryItem | null> {
    await new Promise((res) => setTimeout(res, 40));
    const item = itemsDatabase.find((i) => i.sku.toLowerCase() === sku.toLowerCase());
    return item ? toComputedItem(item) : null;
  },

  async updateStock(
    itemId: string,
    deltaOrOptions: number | StockAdjustmentInput,
    notesArg?: string,
    userNameArg?: string
  ): Promise<ComputedInventoryItem> {
    await new Promise((res) => setTimeout(res, 50));
    const item = itemsDatabase.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found');

    const previousStock = item.currentStock;
    let delta = 0;
    let mode: 'add' | 'deduct' | 'direct' = 'add';
    let reason = 'Stock Adjustment';
    let notes = notesArg || '';
    let unit = item.unit || 'PCS';
    let userName = userNameArg || 'Authorized Staff';
    let userRole = 'Staff';
    let referenceNumber = `ADJ-${Date.now().toString().slice(-6)}`;

    if (typeof deltaOrOptions === 'number') {
      delta = deltaOrOptions;
      mode = delta >= 0 ? 'add' : 'deduct';
      reason = notesArg || (delta >= 0 ? 'Stock Addition (Inward)' : 'Stock Deduction (Outward)');
    } else {
      const opts = deltaOrOptions;
      mode = opts.mode || (opts.delta !== undefined && opts.delta < 0 ? 'deduct' : 'add');
      reason = opts.reason || 'Inventory Adjustment';
      notes = opts.notes || '';
      unit = opts.unit || item.unit || 'PCS';
      userName = opts.userName || userNameArg || 'Authorized Staff';
      userRole = opts.userRole || 'Staff';
      referenceNumber = opts.referenceNumber || `ADJ-${Date.now().toString().slice(-6)}`;

      const conv = item.packagingConversions || DEFAULT_PACKAGING_CONVERSIONS;

      if (mode === 'direct') {
        const target = opts.targetStock !== undefined ? opts.targetStock : (opts.adjustmentQuantity ?? previousStock);
        const targetInBase = convertToBaseQuantity(target, unit, conv);
        delta = targetInBase - previousStock;
      } else {
        const rawQty = opts.adjustmentQuantity !== undefined ? opts.adjustmentQuantity : Math.abs(opts.delta || 0);
        const qtyInBase = convertToBaseQuantity(rawQty, unit, conv);
        delta = mode === 'deduct' ? -qtyInBase : qtyInBase;
      }
    }

    const nextStock = previousStock + delta;
    if (nextStock < 0) {
      throw new Error(`Insufficient stock. Cannot reduce stock below 0 (Current: ${previousStock} ${item.unit})`);
    }

    item.currentStock = nextStock;
    item.updatedAt = new Date().toISOString();

    // Record every adjustment in the stock movement ledger
    try {
      await stockMovementService.addMovement({
        itemId: item.id,
        date: new Date().toISOString(),
        type: 'adjustment',
        stockBefore: previousStock,
        quantityDelta: delta,
        stockAfter: nextStock,
        unit: item.unit,
        userName,
        userRole,
        referenceNumber,
        referenceType: 'Adjustment',
        reason,
        notes: notes ? `${reason} • ${notes}` : reason,
      });
    } catch (err) {
      console.warn('Failed to record stock movement ledger entry:', err);
    }

    // Automatically trigger low-stock and out-of-stock alerts
    try {
      if (nextStock === 0) {
        await notificationService.addNotification({
          title: 'Out of Stock Alert',
          message: `${item.name} (${item.sku}) is completely depleted (0 ${item.unit} on hand)!`,
          type: 'out_of_stock',
          priority: 'urgent',
        });
      } else if (nextStock <= item.reorderLevel) {
        await notificationService.addNotification({
          title: 'Low Stock Alert',
          message: `${item.name} (${item.sku}) is at or below reorder threshold (${nextStock} ${item.unit} remaining, threshold: ${item.reorderLevel} ${item.unit}).`,
          type: 'low_stock',
          priority: 'high',
        });
      }
    } catch (err) {
      console.warn('Failed to dispatch stock alert notification:', err);
    }

    return toComputedItem(item);
  },

  async updateItem(
    itemId: string,
    patch: Partial<Omit<InventoryItem, 'id' | 'createdAt'>>
  ): Promise<ComputedInventoryItem> {
    await new Promise((res) => setTimeout(res, 60));
    const item = itemsDatabase.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found');

    if (patch.sku && patch.sku.toLowerCase() !== item.sku.toLowerCase()) {
      const exists = itemsDatabase.some(
        (i) => i.id !== itemId && i.sku.toLowerCase() === patch.sku!.trim().toLowerCase()
      );
      if (exists) {
        throw new Error(`SKU "${patch.sku}" is already assigned to another item.`);
      }
    }

    Object.assign(item, patch, { updatedAt: new Date().toISOString() });

    // Check if new reorderLevel triggers an alert with current stock
    if (patch.reorderLevel !== undefined && item.currentStock <= item.reorderLevel && item.currentStock > 0) {
      try {
        await notificationService.addNotification({
          title: 'Low Stock Alert (Threshold Updated)',
          message: `${item.name} (${item.sku}) threshold was set to ${item.reorderLevel} ${item.unit} and current stock is ${item.currentStock} ${item.unit}.`,
          type: 'low_stock',
          priority: 'medium',
        });
      } catch {}
    }

    return toComputedItem(item);
  },

  async createItem(newItemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'sales30Days'>): Promise<ComputedInventoryItem> {
    await new Promise((res) => setTimeout(res, 80));

    // Ensure no duplicate SKU
    const exists = itemsDatabase.some(
      (i) => i.sku.toLowerCase() === newItemData.sku.trim().toLowerCase()
    );
    if (exists) {
      throw new Error(`SKU "${newItemData.sku}" already exists in the system.`);
    }

    const id = `item-${newItemData.materialCategory.substring(0, 2)}-${Date.now()}`;
    const now = new Date().toISOString();

    const created: InventoryItem = {
      ...newItemData,
      id,
      sales30Days: 0,
      createdAt: now,
      updatedAt: now,
    };

    itemsDatabase.unshift(created);
    return toComputedItem(created);
  },

  async getCategoryItemCount(category: MaterialCategory): Promise<number> {
    return itemsDatabase.filter((i) => i.materialCategory === category).length;
  },

  async getAllItems(): Promise<ComputedInventoryItem[]> {
    await new Promise((res) => setTimeout(res, 30));
    return itemsDatabase.map(toComputedItem);
  },
};
