import { InventoryItem } from '../types/inventory';
import { DEFAULT_PACKAGING_CONVERSIONS } from '../utils/unitConversions';

/**
 * StockVista Starter Product Catalog
 * 
 * Pre-configured starter catalogue entries for business operations:
 * 1. Card Holder
 * 2. Lanyard
 * 3. Hook
 * 4. Button Bag
 * 
 * Strict constraints:
 * - Names prefilled
 * - Relevant, replaceable images
 * - SKU, HSN, GST, Prices, Units, Reorder Levels, and Warehouses manually configurable
 * - Opening stock defaults strictly to ZERO
 * - No fake prices, GSTINs, HSN codes, warehouses, suppliers, or customers generated
 * - Editable and deletable
 */
export const STARTER_PRODUCTS: InventoryItem[] = [
  {
    id: 'starter-card-holder',
    name: 'Card Holder',
    sku: 'CH-001',
    materialCategory: 'card_holder',
    materialSubtype: 'Card Holders & Sleeves',
    description: 'Durable transparent ID card holder sleeve with top lanyard attachment slot.',
    currentStock: 0,
    unit: 'PCS',
    baseUnit: 'PCS',
    packagingConversions: { ...DEFAULT_PACKAGING_CONVERSIONS },
    reorderLevel: 0,
    reorderQuantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    gstRate: 0,
    hsnCode: '',
    warehouseId: '',
    warehouseName: 'Unassigned',
    rackLocation: '',
    supplierId: '',
    supplierName: 'Unassigned',
    images: ['/products/card-holder.svg'],
    barcode: '',
    sales30Days: 0,
    isArchived: false,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'starter-lanyard',
    name: 'Lanyard',
    sku: 'LAN-001',
    materialCategory: 'lanyard',
    materialSubtype: 'Lanyards & Straps',
    description: 'Premium woven neck strap lanyard equipped with metal attachment clasp.',
    currentStock: 0,
    unit: 'PCS',
    baseUnit: 'PCS',
    packagingConversions: { ...DEFAULT_PACKAGING_CONVERSIONS },
    reorderLevel: 0,
    reorderQuantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    gstRate: 0,
    hsnCode: '',
    warehouseId: '',
    warehouseName: 'Unassigned',
    rackLocation: '',
    supplierId: '',
    supplierName: 'Unassigned',
    images: ['/products/lanyard.svg'],
    barcode: '',
    sales30Days: 0,
    isArchived: false,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'starter-hook',
    name: 'Hook',
    sku: 'HK-001',
    materialCategory: 'hook',
    materialSubtype: 'Hooks & Clasps',
    description: 'Metallic swivel lobster snap hook clasp for badges and lanyards.',
    currentStock: 0,
    unit: 'PCS',
    baseUnit: 'PCS',
    packagingConversions: { ...DEFAULT_PACKAGING_CONVERSIONS },
    reorderLevel: 0,
    reorderQuantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    gstRate: 0,
    hsnCode: '',
    warehouseId: '',
    warehouseName: 'Unassigned',
    rackLocation: '',
    supplierId: '',
    supplierName: 'Unassigned',
    images: ['/products/hook.svg'],
    barcode: '',
    sales30Days: 0,
    isArchived: false,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'starter-button-bag',
    name: 'Button Bag',
    sku: 'BB-001',
    materialCategory: 'button_bag',
    materialSubtype: 'Button Bags & Pouches',
    description: 'Clear grip seal button packaging bag with top header hole.',
    currentStock: 0,
    unit: 'PCS',
    baseUnit: 'PCS',
    packagingConversions: { ...DEFAULT_PACKAGING_CONVERSIONS },
    reorderLevel: 0,
    reorderQuantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    gstRate: 0,
    hsnCode: '',
    warehouseId: '',
    warehouseName: 'Unassigned',
    rackLocation: '',
    supplierId: '',
    supplierName: 'Unassigned',
    images: ['/products/button-bag.svg'],
    barcode: '',
    sales30Days: 0,
    isArchived: false,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

export const MASTER_INVENTORY: InventoryItem[] = STARTER_PRODUCTS;
